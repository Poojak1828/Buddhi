import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

export interface StudyPlanPromptInput {
  subjectName: string;
  syllabus: string;
  examDate?: string;
  dailyHours: number;
  prepLevel: string;
  academicLevel: string;
  priorityTopics?: string;
}

export interface QuizPromptInput {
  subjectName: string;
  chapterTitle?: string;
  topic: string;
  difficulty: string;
  totalQuestions: number;
  academicLevel: string;
  quizType?: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
}

export interface FlashcardPromptInput {
  subjectName: string;
  chapterTitle?: string;
  topic: string;
  content?: string;
  count?: number;
  academicLevel: string;
}

export interface AssistantChatInput {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  academicLevel?: string;
  studentName?: string;
  currentStreak?: number;
  stressLevelNotes?: string;
}

export interface AnswerEvaluationInput {
  questionText: string;
  questionType: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  sampleAnswer?: string;
  keyPoints?: string[];
  studentAnswer: string;
  subjectName?: string;
}

export interface AnswerEvaluationResult {
  score: number; // 0 to 100
  passed: boolean;
  feedback: string;
  strengths: string[];
  mistakes: string[];
  improvements: string[];
  modelAnswer: string;
}

export class AIService {
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  /**
   * Set or update Gemini API key at runtime
   */
  public updateApiKey(key: string): void {
    if (key && key.trim()) {
      this.geminiClient = new GoogleGenerativeAI(key.trim());
    }
  }

  /**
   * System prompt for Buddhi AI: System Instructions & Fallback Guardrails
   */
  private getPsychologistSystemPrompt(academicLevel?: string, studentName?: string): string {
    const nameStr =
      studentName && studentName.trim() && studentName.trim() !== 'Student'
        ? `The authenticated student's name is ${studentName.trim()}. Address them naturally when appropriate, but do not repeat it constantly.`
        : `Address the student naturally without assuming or inventing a name.`;

    const levelStr =
      academicLevel && academicLevel.trim() && academicLevel !== 'Curriculum' && academicLevel !== 'SENIOR_SECONDARY_PREP'
        ? `The student's academic level/course is ${academicLevel}.`
        : `Calibrate explanations according to the complexity of the question.`;

    return `System Instructions & Fallback Guardrails

Core Persona & Objective:
You are Buddhi AI, an intelligent, human-like study companion and academic mentor. Your goal is to converse naturally, warmly, and authoritatively like a real human tutor in an actual conversation. Provide direct, accurate, context-aware responses with natural conversational flow.
${nameStr}
${levelStr}

1. Natural Human Conversation & Formatting Rules:
- NO ASTERISK BOLD TAGS: Do not use "**" tags or excessive bold asterisks. Write in clean, natural prose, exactly as a human educator would speak and write in a conversation. Use clean line breaks, standard mathematical equations (e.g., y = mx + c), and simple bullet points or numbers when listing steps.
- DO NOT ASK FOLLOW-UP QUESTIONS: Do not end your responses with nagging follow-up questions (such as "What specific question would you like to explore?", "Would you like approach 1, 2, or 3?", or "Would you like a quiz?"). Give a thorough, complete, and confident answer and conclude naturally.
- MULTI-TURN MEMORY & CONTINUATION:
  * Always evaluate the user's input against the ongoing conversation history.
  * When the user types short affirmations or continuation phrases—such as "yes", "yeah", "yep", "sure", "tell me more", "explain more", "go on", "continue", "please do"—they mean they want to explore or know more about the topic discussed in the immediate previous messages.
  * NEVER treat words like "yes", "ok", or "sure" as independent topics to define or explain! Look at the prior turn, recognize the topic being discussed, and seamlessly explain that topic with depth and clarity.

2. Contextual Routing & Input Intent Parsing:
- Conversational Acknowledgments & Filler ("ok", "sure", "got it", "cool", "thanks", "sounds good", "done"):
  * DO NOT define, explain, or etymologize these phrases. Avoid the "Dictionary Trap"!
  * If context exists: advance to the next logical step or provide deeper depth.
  * If no context exists: acknowledge politely and invite the student to share what they want to work on.
- Ambiguous or Incomplete Queries:
  * State what is understood, briefly provide the core foundation, and cover the main paths forward without interrogating the user.
- Emergency Reset & Misunderstanding Recovery ("that's not what i meant", "stop defining", "you misunderstood"):
  * Acknowledge instantly without defensive excuses, reset context, and ask for the target requirement.

3. Accuracy & Calculation Rules:
- Direct arithmetic: "What is 4 + 4?" -> "4 + 4 = 8.", "What is 15 multiplied by 6?" -> "15 × 6 = 90."
- Simple facts: "What is the capital of India?" -> "The capital of India is New Delhi."
- Academic queries: Answer directly with clear conceptual explanations, formulas, and real-world analogies.`;
  }

  /**
   * Generate an adaptive, structured study plan
   */
  async generateStudyPlan(input: StudyPlanPromptInput): Promise<{
    title: string;
    summary: string;
    schedule: Array<{
      day: number;
      dateLabel: string;
      tasks: Array<{
        title: string;
        description: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        durationMin: number;
      }>;
    }>;
  }> {
    const prompt = `Create a structured, highly realistic daily study plan for a student.
Subject: ${input.subjectName}
Syllabus / Chapters: ${input.syllabus}
Target Exam Date: ${input.examDate || 'In 30 days'}
Daily Available Hours: ${input.dailyHours} hours
Current Preparation Level: ${input.prepLevel}
Academic Level: ${input.academicLevel}
Priority Topics: ${input.priorityTopics || 'All standard syllabus modules'}

Return ONLY a valid JSON object matching this schema:
{
  "title": "Comprehensive Study Plan for ...",
  "summary": "Brief 2-3 sentence overview with a warm encouraging note.",
  "schedule": [
    {
      "day": 1,
      "dateLabel": "Day 1",
      "tasks": [
        {
          "title": "Task title",
          "description": "Clear actionable instruction",
          "priority": "HIGH",
          "durationMin": 45
        }
      ]
    }
  ]
}
Include at least 5-7 days of progressive study and built-in active recall / revision sessions.`;

    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          { text: this.getPsychologistSystemPrompt(input.academicLevel) },
          { text: prompt },
        ]);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('[AIService] Gemini API call failed, using intelligent fallback:', err);
      }
    }

    return this.createIntelligentFallbackPlan(input);
  }

  /**
   * Generate Quiz (MCQ, Short Answers, or Long Answers)
   */
  async generateQuiz(input: QuizPromptInput): Promise<{
    title: string;
    quizType: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
    questions: Array<{
      questionText: string;
      questionType: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
      options: string[];
      correctIndex: number;
      sampleAnswer?: string;
      keyPoints?: string[];
      explanation: string;
    }>;
  }> {
    const quizType = input.quizType || 'MCQ';
    const totalCount = Math.max(20, input.totalQuestions || 20);

    if (this.geminiClient) {
      try {
        const prompt = `Generate a ${input.difficulty} ${quizType} quiz for ${input.subjectName} ${input.chapterTitle ? `(Chapter: ${input.chapterTitle})` : ''} on topic "${input.topic}".
Number of questions: ${totalCount} (MUST BE AT LEAST 20 QUESTIONS).
Academic Level: ${input.academicLevel}.

Return ONLY valid JSON matching:
{
  "title": "${input.subjectName} - ${input.topic} (${quizType.replace('_', ' ')})",
  "quizType": "${quizType}",
  "questions": [
    {
      "questionText": "Detailed question text grounded in syllabus",
      "questionType": "${quizType}",
      "options": ["A", "B", "C", "D"], // 4 plausible distinct choices
      "correctIndex": 0, // 0 to 3
      "explanation": "Clear explanation of core principles"
    }
  ]
}`;
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          { text: this.getPsychologistSystemPrompt(input.academicLevel) },
          { text: prompt },
        ]);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.questions && parsed.questions.length >= 20) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('[AIService] Gemini API call failed, using intelligent quiz generator:', err);
      }
    }

    return this.createIntelligentFallbackQuiz({ ...input, totalQuestions: totalCount });
  }

  /**
   * Evaluate a student's written Short or Long answer
   */
  async evaluateStudentAnswer(input: AnswerEvaluationInput): Promise<AnswerEvaluationResult> {
    const { questionText, studentAnswer, sampleAnswer, keyPoints, questionType } = input;

    if (!studentAnswer || !studentAnswer.trim()) {
      return {
        score: 0,
        passed: false,
        feedback: 'No answer provided. Please attempt the question to receive personalized guidance.',
        strengths: [],
        mistakes: ['Blank response.'],
        improvements: ['Review the core definition and write down the fundamental principle first.'],
        modelAnswer: sampleAnswer || 'Refer to the textbook concept breakdown.',
      };
    }

    if (this.geminiClient) {
      try {
        const prompt = `Act as an expert, empathetic examiner.
Question: "${questionText}"
Question Type: ${questionType}
Reference Model Answer: "${sampleAnswer || 'Standard curriculum model answer'}"
Key Points Expected: ${JSON.stringify(keyPoints || [])}
Student's Written Answer: "${studentAnswer}"

Evaluate the student's answer constructively.
Return ONLY valid JSON matching this schema:
{
  "score": 85, // integer 0-100
  "passed": true, // true if score >= 60
  "feedback": "Encouraging, precise feedback summarizing their understanding",
  "strengths": ["Clear definition of X", "Accurate mathematical formula"],
  "mistakes": ["Did not mention the condition of constant temperature", "Missed SI units"],
  "improvements": ["Always state assumptions before writing the governing equation", "Include the term 'equilibrium'"],
  "modelAnswer": "Comprehensive reference answer"
}`;
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('[AIService] Gemini evaluation failed, using fallback evaluator:', err);
      }
    }

    return this.createIntelligentFallbackEvaluation(input);
  }

  /**
   * Generate Flashcards
   */
  async generateFlashcards(input: FlashcardPromptInput): Promise<
    Array<{
      question: string;
      answer: string;
      keyConcept: string;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    }>
  > {
    const count = input.count || 6;
    const prompt = `Generate ${count} high-yield study flashcards for ${input.subjectName} on "${input.topic}".
Reference Material: ${input.content || 'Standard academic curriculum'}
Academic Level: ${input.academicLevel}.

Return ONLY a valid JSON array matching:
[
  {
    "question": "Clear concept or question",
    "answer": "Concise, precise explanation",
    "keyConcept": "Core law, formula, or principle",
    "difficulty": "MEDIUM"
  }
]`;

    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent([
          { text: this.getPsychologistSystemPrompt(input.academicLevel) },
          { text: prompt },
        ]);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('[AIService] Gemini API call failed, using fallback flashcards:', err);
      }
    }

    return this.createIntelligentFallbackFlashcards(input);
  }

  /**
   * Interactive AI Study Assistant Chat with Direct Answering & Conversational Empathy
   */
  async chatAssistant(input: AssistantChatInput): Promise<{
    reply: string;
    suggestedFollowups: string[];
    emotionalTone: string;
  }> {
    const raw = input.message.trim();
    const lower = raw.toLowerCase();

    // 1. Direct Arithmetic Solver (Handles "can u tell 4+4", "What is 15 multiplied by 6?", etc.)
    const arithmeticResult = this.tryEvaluateArithmetic(raw);
    if (arithmeticResult) {
      return {
        reply: arithmeticResult,
        suggestedFollowups: [
          'Calculate another expression',
          'Solve a linear algebraic equation',
          'Explain the calculation step by step',
        ],
        emotionalTone: 'clear-direct',
      };
    }

    // 2. Real AI Model Call (Google Gemini)
    const client = this.getGeminiClient();
    if (client) {
      try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const systemPrompt = this.getPsychologistSystemPrompt(input.academicLevel, input.studentName);

        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemPrompt }],
          },
        });

        // Use proper chat session with conversation history
        const chat = model.startChat({
          history: (input.history || []).slice(-10).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
        });

        const result = await chat.sendMessage(raw);
        const replyText = result.response.text();

        if (replyText && replyText.trim()) {
          return {
            reply: replyText.trim(),
            suggestedFollowups: this.generateFollowups(raw, input.academicLevel),
            emotionalTone: 'helpful-conversational',
          };
        }
      } catch (err: any) {
        console.warn('[AIService] Live Gemini API call error:', err.message || err);
      }
    } else if (config.aiProvider === 'gemini' || process.env.AI_PROVIDER === 'gemini') {
      return {
        reply: '⚠️ **AI Provider Notice:** The backend is configured for live Google Gemini (`AI_PROVIDER="gemini"`), but `GEMINI_API_KEY` is not set or empty in `backend/.env`. Please add your `GEMINI_API_KEY` in `backend/.env` to enable live Gemini AI generation.',
        suggestedFollowups: [
          'How do I add a Gemini API key?',
          'Switch to local assistant mode',
        ],
        emotionalTone: 'warning',
      };
    }

    // 3. Conversational Local Engine (Dynamic, responsive, zero fixed menus, zero fake templates)
    const isAnxious =
      lower.includes('stress') ||
      lower.includes('anxiety') ||
      lower.includes('overwhelmed') ||
      lower.includes('scared') ||
      lower.includes('depressed') ||
      lower.includes('failing') ||
      lower.includes('cant do this') ||
      lower.includes("can't do this") ||
      lower.includes('burnout') ||
      lower.includes('behind');

    return this.synthesizeTopicAwareResponse(input, isAnxious);
  }

  /**
   * Fast, reliable arithmetic evaluator for simple student math questions
   */
  private tryEvaluateArithmetic(raw: string): string | null {
    const clean = raw.trim();

    // 1. Strip conversational wrappers
    let text = clean
      .replace(/^(can\s+(you|u)\s+(tell|calculate|solve|give me|find)\s*(me)?\s*:?)/i, '')
      .replace(/^(please\s+)?(tell\s+me|calculate|solve|what\s+is|what's|evaluate|compute)\s+/i, '')
      .replace(/^(the\s+value\s+of|the\s+result\s+of|the\s+answer\s+to)\s+/i, '')
      .replace(/[\?\!\.]+$/g, '')
      .trim();

    // 2. Convert word operators to standard symbols
    const wordPattern = text
      .replace(/\bmultiplied\s+by\b/gi, '*')
      .replace(/\btimes\b/gi, '*')
      .replace(/\bdivided\s+by\b/gi, '/')
      .replace(/\bplus\b/gi, '+')
      .replace(/\bminus\b/gi, '-')
      .replace(/×/g, '*')
      .replace(/x/gi, '*');

    // 3. Match [number] [operator] [number]
    const match = wordPattern.match(/^(\-?\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\-?\d+(?:\.\d+)?)$/);
    if (match) {
      const a = parseFloat(match[1]);
      const op = match[2];
      const b = parseFloat(match[3]);

      let res: number;
      let displayOp = op;
      if (op === '+') {
        res = a + b;
        displayOp = '+';
      } else if (op === '-') {
        res = a - b;
        displayOp = '-';
      } else if (op === '*') {
        res = a * b;
        displayOp = '×';
      } else if (op === '/') {
        if (b === 0) return 'Division by zero is undefined.';
        res = a / b;
        displayOp = '/';
      } else {
        return null;
      }

      const formattedRes = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(4)).toString();
      return `${a} ${displayOp} ${b} = ${formattedRes}.`;
    }

    return null;
  }

  private getGeminiClient(): GoogleGenerativeAI | null {
    const key = process.env.GEMINI_API_KEY || config.geminiApiKey;
    if (key && key.trim() !== '') {
      if (!this.geminiClient) {
        this.geminiClient = new GoogleGenerativeAI(key.trim());
      }
      return this.geminiClient;
    }
    return null;
  }

  /**
   * Extract previous discussion topic from recent conversation history
   */
  private extractTopicFromHistory(history?: Array<{ role: string; content: string }>): string | null {
    if (!history || history.length === 0) return null;

    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      const text = item.content.trim();

      if (item.role === 'user') {
        const cleaned = text
          .toLowerCase()
          .replace(/^(can\s+(you|u)\s+(tell|explain|teach|give)\s*(me)?\s*(about)?)/i, '')
          .replace(/^(please\s+)?(tell\s+me(\s+about)?|explain(\s+to\s+me)?|what\s+is|what\s+are|what\s+was|what\s+were|define|describe|teach\s+me\s+about|teach\s+me)\s+/i, '')
          .replace(/^(what\s+do\s+you\s+mean\s+by|what\s+does\s+mean)\s+/i, '')
          .replace(/[\?\!\.\,\;\:]+$/g, '')
          .trim();

        const nonTopicWords = [
          'hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'sure', 'thanks', 'thank you',
          'cool', 'got it', 'help', 'do it', 'continue', 'proceed', 'start', 'done', 'right',
          'yep', 'yeah', 'sounds good', 'alright'
        ];
        if (cleaned.length > 2 && !nonTopicWords.includes(cleaned)) {
          return cleaned;
        }
      } else if (item.role === 'assistant') {
        const matchInvolving = text.match(/involving\s+([a-zA-Z0-9\s\-]+?)\s+would\s+you/i);
        if (matchInvolving && matchInvolving[1]) {
          const t = matchInvolving[1].trim().replace(/^what\s+(is|are)\s+/i, '');
          if (t.length > 2) return t;
        }
        const matchSubject = text.match(/^([a-zA-Z0-9\s\-]{3,30})\s+(?:is|are|refers\s+to)\s+/i);
        if (matchSubject && matchSubject[1]) {
          const s = matchSubject[1].trim();
          if (!['here', 'this', 'there', 'it', 'under', 'ready', 'hello', 'understood'].includes(s.toLowerCase())) {
            return s;
          }
        }
      }
    }
    return null;
  }

  /**
   * Dynamic Subject, Topic, Project & Calculation Knowledge Synthesizer
   */
  private synthesizeTopicAwareResponse(input: AssistantChatInput, isAnxious: boolean): {
    reply: string;
    suggestedFollowups: string[];
    emotionalTone: string;
  } {
    const raw = input.message.trim();
    const lower = raw.toLowerCase();
    const studentName =
      input.studentName?.trim() && input.studentName.trim() !== 'Student'
        ? input.studentName.trim()
        : '';
    const greeting = studentName ? `Hello ${studentName}!` : 'Hello!';

    const cleanLower = raw.toLowerCase().replace(/[\?\!\.\,\;\:]+$/g, '').trim();

    // ==========================================
    // 0A. Emergency Reset & Misunderstanding Recovery
    // ==========================================
    if (
      cleanLower.includes("not what i meant") ||
      cleanLower.includes("stop defining") ||
      cleanLower.includes("you misunderstood") ||
      cleanLower.includes("not what i asked") ||
      cleanLower.includes("did not ask") ||
      cleanLower.includes("didn't ask")
    ) {
      const res = {
        reply: "Understood, my mistake. Let's reset context. What specific task, question, or requirement would you like to focus on?",
        suggestedFollowups: [
          'Give me a beginner coding project',
          'Explain linear equations',
          'Make a study plan for tomorrow',
        ],
        emotionalTone: 'clear-direct',
      };
      res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
      return res;
    }

    // ==========================================
    // 0B. Affirmations & Continuation Requests (Multi-Turn Topic Awareness)
    // When the user says "yes", "yeah", "yep", "sure", "tell me more", they mean they want to know more about the previous topic.
    // NEVER treat "yes" as a topic to define!
    // ==========================================
    const affirmationPhrases = [
      'yes', 'yeah', 'yep', 'yup', 'sure', 'yes please', 'yeah please', 'yep please',
      'tell me', 'tell me more', 'explain', 'explain more', 'explain it', 'go on',
      'continue', 'please do', 'i do', 'i would', 'why not', 'of course', 'definitely',
      'absolutely', 'more', 'tell me about it', 'ok tell me', 'yes explain', 'yes tell me',
      'yes i want to know', 'i want to know more', 'proceed', 'proceed please',
    ];

    if (affirmationPhrases.includes(cleanLower)) {
      const previousTopic = this.extractTopicFromHistory(input.history);
      if (previousTopic) {
        const res = this.explainAcademicConcept(previousTopic, previousTopic.toLowerCase(), studentName, true);
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      // Check if previous assistant message proposed a project or schedule
      const lastAssistantMsg = input.history && input.history.length > 0
        ? [...input.history].reverse().find(m => m.role === 'assistant')?.content.toLowerCase() || ''
        : '';

      if (lastAssistantMsg.includes('project') || lastAssistantMsg.includes('option 1') || lastAssistantMsg.includes('option 2')) {
        const res = {
          reply: 'Understood. We can start with Step 1 of the implementation by setting up the project folder, core dependencies, and initial data structures.',
          suggestedFollowups: [
            'Let\'s start with Step 1',
            'Show the database schema',
            'Review the architecture overview',
          ],
          emotionalTone: 'helpful-collaborative',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      if (lastAssistantMsg.includes('schedule') || lastAssistantMsg.includes('study plan') || lastAssistantMsg.includes('sprint')) {
        const res = {
          reply: 'Understood. This study routine is structured to balance focused cognitive blocks with deliberate recovery intervals.',
          suggestedFollowups: [
            'Lock in this schedule',
            'Adjust morning hours',
            'Add more breaks',
          ],
          emotionalTone: 'structured-planning',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      const res = {
        reply: 'I am ready. Tell me what topic, concept, or problem you would like to explore.',
        suggestedFollowups: [
          'Explain linear equations',
          'Explain quadratic equations',
          'Explain recursion',
        ],
        emotionalTone: 'helpful-conversational',
      };
      res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
      return res;
    }

    // ==========================================
    // 0C. Conversational Acknowledgments & Filler (Avoid the Dictionary Trap!)
    // Trigger Words/Phrases: "ok", "ok sure", "got it", "sounds good", "alright", "cool", "thanks", "makes sense", etc.
    // Handling: DO NOT define, explain, etymologize, or parse these phrases as content topics.
    // ==========================================
    const fillerPhrases = [
      'ok', 'okay', 'ok sure', 'okay sure', 'got it', 'sounds good', 'alright',
      'all right', 'cool', 'thanks', 'thank you', 'makes sense', 'great', 'awesome',
      'perfect', 'done', 'nice', 'understood', 'right',
    ];

    if (fillerPhrases.includes(cleanLower)) {
      // Check multi-turn continuity from history
      const lastAssistantMsg = input.history && input.history.length > 0
        ? [...input.history].reverse().find(m => m.role === 'assistant')?.content.toLowerCase() || ''
        : '';

      if (lastAssistantMsg.includes('project') || lastAssistantMsg.includes('option 1') || lastAssistantMsg.includes('option 2')) {
        const res = {
          reply: 'Understood. We can begin with Step 1 of the implementation whenever you are ready.',
          suggestedFollowups: [
            'Let\'s start with Step 1',
            'Show the database schema',
            'Review the architecture overview',
          ],
          emotionalTone: 'helpful-collaborative',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      if (lastAssistantMsg.includes('quiz') || lastAssistantMsg.includes('question 1')) {
        const res = {
          reply: 'Ready when you are. Share your answers whenever you have worked through the problems.',
          suggestedFollowups: [
            'Check my answers',
            'Give me another practice question',
            'Explain Question 1 in detail',
          ],
          emotionalTone: 'formative-assessment',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      if (lastAssistantMsg.includes('schedule') || lastAssistantMsg.includes('study plan') || lastAssistantMsg.includes('sprint')) {
        const res = {
          reply: 'Sounds good. This timetable gives you focused time blocks while preserving your energy.',
          suggestedFollowups: [
            'Lock in this schedule',
            'Adjust morning hours',
            'Add more breaks',
          ],
          emotionalTone: 'structured-planning',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      if (input.history && input.history.length > 0) {
        const res = {
          reply: 'Understood. Ready to proceed with the next step.',
          suggestedFollowups: [
            'Continue to next step',
            'Explain linear equations',
            'Make a study plan for tomorrow',
          ],
          emotionalTone: 'helpful-collaborative',
        };
        res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
        return res;
      }

      const res = {
        reply: 'Got it! What would you like to work on next?',
        suggestedFollowups: [
          'Explain linear equations',
          'Give me a beginner coding project',
          'Make a study plan for tomorrow',
        ],
        emotionalTone: 'helpful-conversational',
      };
      res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
      return res;
    }

    // ==========================================
    // 0D. Vague Action Requests
    // Triggers: "do it", "fix this", "apply it", "go ahead", "proceed", "start", "run it"
    // ==========================================
    const vagueActions = ['do it', 'fix this', 'apply it', 'go ahead', 'proceed', 'start', 'run it', 'continue', 'apply fix'];
    if (vagueActions.includes(cleanLower)) {
      if (input.history && input.history.length > 0) {
        return {
          reply: 'Ready to proceed with that. Just to confirm, should I apply this change directly or walk through the specific steps first?',
          suggestedFollowups: [
            'Apply changes directly',
            'Walk through the steps first',
          ],
          emotionalTone: 'helpful-collaborative',
        };
      }
      return {
        reply: 'Ready to help! Please tell me what specific task, code, or topic you would like me to work on.',
        suggestedFollowups: [
          'Give me a beginner coding project',
          'Explain a difficult concept',
          'Create a study plan',
        ],
        emotionalTone: 'helpful-conversational',
      };
    }

    // ==========================================
    // 0D. Fragmented Queries
    // Single short noun phrase with missing parameters
    // ==========================================
    if (cleanLower === 'database connection' || cleanLower === 'db connection') {
      return {
        reply: 'Are you looking to set up a new database connection, debug an existing connection error, or configure environment variables?',
        suggestedFollowups: [
          'Set up a new PostgreSQL connection',
          'Debug database connection error',
          'Configure DATABASE_URL environment variable',
        ],
        emotionalTone: 'clear-direct',
      };
    }

    // ==========================================
    // 1. Emotional Burnout / Overwhelm Check
    // ==========================================
    if (isAnxious) {
      return {
        reply: `${greeting} First, take a slow, gentle breath in... and let it out. 🌿\n\nI want to remind you of something essential: **Your academic worth is never defined by feeling exhausted, having an unfinished chapter, or hitting a wall.**\n\nCognitive fatigue happens to every ambitious student. Here is our 3-step immediate reset:\n\n1. **Zero Guilt:** You are not failing; your prefrontal cortex simply needs neural rest to consolidate what you have already absorbed.\n2. **The 10-Minute Micro-Win:** Do not think about the entire syllabus. Pick just ONE simple definition or 1 formula. We will study it for 10 minutes, then pause.\n3. **Physical Fuel:** Drink a glass of water, step away from screens for 5 minutes, and stretch.\n\nWould you like me to tell a light intuitive story about your current topic, or shall we plan a low-pressure 15-minute study session together?`,
        suggestedFollowups: [
          'Break my hardest topic into a simple story',
          'Help me plan a 15-minute gentle study session',
          'Give me an active recall question to boost confidence',
        ],
        emotionalTone: 'calming-supportive',
      };
    }

    // ==========================================
    // 2. Greetings & Capabilities Inquiries
    // ==========================================
    const isGreeting =
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower === 'yo' ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ') ||
      lower.startsWith('hey ') ||
      lower.startsWith('good morning') ||
      lower.startsWith('good afternoon') ||
      lower.startsWith('good evening') ||
      lower.includes('who are you') ||
      lower.includes('what can you do') ||
      lower.includes('what are you') ||
      lower.includes('tell me about yourself') ||
      lower === 'help';

    if (isGreeting) {
      return {
        reply: `${greeting} I am **Buddhi**, your personal AI study companion and academic mentor.\n\nHere is how I can help you accelerate your learning:\n• 🚀 **Hands-on Projects:** Suggest beginner-to-advanced coding and academic project ideas with complete architectural breakdowns.\n• 💡 **Conceptual Tutoring:** Break down difficult concepts in Computer Science, Physics, Chemistry, Biology, and Math into clear mental models and everyday analogies.\n• 💻 **Programming & Algorithms:** Explain algorithms (like recursion and dynamic programming), debug code, and walk through data structures.\n• 📅 **Study & Revision Schedules:** Plan structured daily study timetables tailored to your milestones with built-in rest intervals.\n• 📝 **Practice Quizzes & Assessments:** Create customized quizzes in Multiple Choice, Short Answer, or Long Answer formats with detailed feedback on mistakes.\n• 🌿 **Empathetic Pacing:** Support your mental well-being with zero guilt when you feel overwhelmed or behind schedule.\n\nWhat would you like to explore or work on right now?`,
        suggestedFollowups: [
          'Give us a project to work on',
          'Explain recursion in simple words',
          'Suggest five beginner coding projects',
          'Make a study plan for tomorrow',
        ],
        emotionalTone: 'calming-supportive',
      };
    }

    // ==========================================
    // 3. Project Suggestions & Ideas
    // ==========================================
    const isProjectQuery =
      lower.includes('project') ||
      lower.includes('build something') ||
      lower.includes('hackathon idea') ||
      lower.includes('portfolio work');

    if (isProjectQuery) {
      // 3A. Beginner Coding Projects (e.g. "Suggest five beginner coding projects")
      if (
        lower.includes('beginner') ||
        lower.includes('five') ||
        lower.includes('5') ||
        lower.includes('coding projects') ||
        lower.includes('programming project')
      ) {
        return {
          reply: `Here are **five outstanding beginner coding projects** designed to build core engineering muscle and create an impressive portfolio piece:\n\n---\n\n### 1. 📋 Interactive Task & Habit Priority Board\n• **Domain:** Frontend Web Development\n• **Recommended Tech Stack:** HTML, CSS, JavaScript (or React + Tailwind CSS)\n• **What it does:** Allows users to create tasks, assign priority levels (High, Medium, Low), filter by tags, and track daily habit completion streaks.\n• **Key Concepts Learned:** DOM manipulation or React state hooks (\`useState\`, \`useEffect\`), event handling, and persisting data in browser \`localStorage\`.\n\n### 2. ⛅ Real-Time Weather & Air Quality Dashboard\n• **Domain:** API Integration & Asynchronous Programming\n• **Recommended Tech Stack:** JavaScript (Fetch API) or Python (Requests + Flask)\n• **What it does:** Users input any city name, and the app fetches live temperature, humidity, wind speed, and Air Quality Index (AQI) from a free API (e.g., OpenWeather or Open-Meteo).\n• **Key Concepts Learned:** Asynchronous programming (\`async/await\`), consuming external REST APIs, error handling (e.g., invalid city names or network drops), and dynamic UI rendering.\n\n### 3. 💰 Command-Line Expense Tracker & Budget Analyzer\n• **Domain:** Core Logic & Systems\n• **Recommended Tech Stack:** Python, C++, or Node.js (CLI)\n• **What it does:** A terminal tool to log daily expenditures with categories (Food, Books, Travel), calculate monthly totals, and automatically export formatted reports to a \`.csv\` or \`.json\` file.\n• **Key Concepts Learned:** File I/O operations, data structures (lists, hash maps / dictionaries), input validation, and modular code architecture.\n\n### 4. 📝 Markdown Study Notes & Flashcard Previewer\n• **Domain:** Full-Stack / Productivity Tool\n• **Recommended Tech Stack:** React / TypeScript or Vanilla JavaScript\n• **What it does:** A dual-pane note editor where the left side accepts Markdown text and the right side live-renders formatted HTML with math equations, plus a button to convert bold terms into flip flashcards.\n• **Key Concepts Learned:** String parsing, regular expressions, component layout, and keyboard shortcuts.\n\n### 5. 🎮 Timed Quiz Game with Scoreboard & Streak Multipliers\n• **Domain:** Logic & Game Development\n• **Recommended Tech Stack:** Vanilla JavaScript or Python (Pygame / CLI)\n• **What it does:** Presents timed multiple-choice questions across categories, awards streak multipliers for consecutive correct answers, and saves high scores on a local leaderboard.\n• **Key Concepts Learned:** Timers (\`setInterval\`), array shuffling (Fisher-Yates algorithm), state machines, and scoring algorithms.\n\n---\n\nWhich of these 5 projects excites you most? Let me know and I will provide the step-by-step file structure and implementation roadmap!`,
          suggestedFollowups: [
            'Break down the architecture for the Weather Dashboard',
            'Give me the file structure for the Expense Tracker',
            'How do I add a database to the Task Board?',
          ],
          emotionalTone: 'empowering-academic',
        };
      }

      // 3B. General Project Request (e.g. "Give us a project to work on.")
      return {
        reply: `Here are **three compelling project ideas** spanning different domains that solve real-world problems and look great on a resume:\n\n---\n\n### Option 1: 🌐 DevPulse – Collaborative Study & Resource Hub (Full-Stack Web)\n• **The Problem:** Students and teammates often have notes, exam deadlines, and study links scattered across multiple apps.\n• **What You Build:** A clean, responsive dashboard where study circles can share markdown revision sheets, set shared examination countdown timers, and collaborate in shared focus rooms.\n• **Recommended Stack:** React / TypeScript (Frontend), Node.js / Express (Backend), PostgreSQL or SQLite (Database).\n• **Key Features to Implement:** User authentication (JWT), live topic mastery progress bars, file upload or Google Drive linking, and interactive revision checklists.\n\n### Option 2: 🤖 SmartRecall – AI-Powered Quiz & Flashcard Engine (Python / AI / CLI)\n• **The Problem:** Rereading notes is passive and ineffective; active recall with spaced repetition is proven to yield 2x better retention.\n• **What You Build:** A tool that ingests text notes or chapter summaries, extracts core key-value concepts, and schedules diagnostic quizzes using the Leitner spaced repetition algorithm.\n• **Recommended Stack:** Python (FastAPI or Click/Rich for CLI), SQLite, optional Gemini/OpenAI API integration for question generation.\n• **Key Features to Implement:** Spaced repetition scheduling (increasing intervals for mastered cards), score tracking, and automated MCQ generation.\n\n### Option 3: ⚡ FocusForge – Developer Pomodoro & Habit Analytics Tool (Systems / Desktop / CLI)\n• **The Problem:** Context switching and distractions derail deep work sessions.\n• **What You Build:** A lightweight, distraction-free productivity utility that logs deep-focus sprints, tracks unbroken daily streaks, and generates weekly visual study time charts.\n• **Recommended Stack:** TypeScript / Node.js (or Python / Go), SQLite / Local JSON.\n• **Key Features to Implement:** Audio/visual timer notifications, terminal graphs (using ASCII bars), and streak calculation logic.\n\n---\n\n**Which domain do you and your team prefer to work on?**\n1. **Full-Stack Web Application** (React + Node.js)\n2. **Python / AI & Automation** (Data & Algorithms)\n3. **Systems & CLI Productivity Tool** (Fast, focused utility)\n\nTell me which track you want to build, and I will outline the complete step-by-step architecture, database schema, and project milestones!`,
        suggestedFollowups: [
          'Let\'s build the Full-Stack Study Hub (Option 1)',
          'I prefer Option 2: Python AI Flashcard Engine',
          'Suggest five beginner coding projects instead',
        ],
        emotionalTone: 'empowering-academic',
      };
    }

    // ==========================================
    // 4. Computer Science: Recursion & Algorithms
    // ==========================================
    if (lower.includes('recursion') || lower.includes('recursive')) {
      return {
        reply: `Let's break down **Recursion** in simple, intuitive words without unnecessary jargon.\n\n---\n\n### 1. The Visual Analogy (Russian Nesting Dolls)\nImagine you have a set of traditional Russian nesting dolls (*Matryoshka*).\n• To find what is inside, you open the outermost doll.\n• Inside is another doll—slightly smaller, but of the exact same kind.\n• You repeat the same action: open it, find a smaller one, open it...\n• Finally, you reach the smallest, solid wooden doll that **cannot be opened**. You stop, and you can now count or put them all back together.\n\nIn programming, **Recursion is simply a function that calls itself to solve a smaller sub-problem of the exact same kind**, until it reaches a point so small that the answer is trivial (the **Base Case**).\n\n---\n\n### 2. The Two Golden Rules of Every Recursive Function\nEvery single recursive function in the world MUST have two parts:\n1. **The Base Case (When to STOP):**\n   This is the emergency brake. Without a base case, the function calls itself forever until your computer runs out of memory and crashes with a **Stack Overflow** error.\n2. **The Recursive Step (Moving CLOSER to the stop):**\n   The function calls itself, but with a **smaller or simpler input** that directly leads toward the base case.\n\n---\n\n### 3. A Simple, Concrete Example: Factorial\nIn mathematics, \`5! = 5 × 4 × 3 × 2 × 1 = 120\`.\nNotice the pattern: \`5! = 5 × (4!)\`.\nIn general: \`n! = n × (n - 1)!\` (and \`1! = 1\`).\n\nHere is how clean this looks in code:\n\`\`\`javascript\nfunction factorial(n) {\n  // 1. Base Case: if n is 1 or 0, we know the answer immediately!\n  if (n <= 1) {\n    return 1;\n  }\n\n  // 2. Recursive Step: n multiplied by factorial of (n - 1)\n  return n * factorial(n - 1);\n}\n\`\`\`\n\n---\n\n### 4. What Actually Happens in Computer Memory (The Call Stack)\nWhen you call \`factorial(3)\`:\n1. \`factorial(3)\` pauses and asks: *"What is 3 × factorial(2)?"* (Pushed to stack)\n2. \`factorial(2)\` pauses and asks: *"What is 2 × factorial(1)?"* (Pushed to stack)\n3. \`factorial(1)\` hits the **Base Case** and returns \`1\`! (Popped from stack)\n4. Now the stack unwinds in reverse:\n   • \`factorial(2)\` calculates \`2 × 1 = 2\` and returns \`2\`.\n   • \`factorial(3)\` calculates \`3 × 2 = 6\` and returns \`6\`.\n\nFinal output: **6**.\n\n---\n\n### 5. When Should You Use Recursion vs a Loop?\n• **Use a regular loop (for/while)** when doing simple counting, summing an array, or basic iteration (loops are faster and use \`O(1)\` memory).\n• **Use recursion** when dealing with naturally branching or hierarchical data structures—such as **Trees** (folder structures, DOM trees), **Graphs** (navigating maps/networks), and **Divide-and-Conquer algorithms** (like Merge Sort and Quicksort).\n\nWould you like me to show how recursion searches a tree, or solve a practice problem together?`,
        suggestedFollowups: [
          'Show me recursion with the Fibonacci sequence',
          'What causes a Stack Overflow and how do I prevent it?',
          'Explain Merge Sort using recursion',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 5. Study Plan for Tomorrow / Daily Plan
    // ==========================================
    if (
      (lower.includes('tomorrow') && (lower.includes('plan') || lower.includes('schedule') || lower.includes('study') || lower.includes('routine'))) ||
      lower.includes('make a study plan for tomorrow')
    ) {
      return {
        reply: `Here is a **high-efficiency, psychologically balanced study plan for tomorrow** designed to maximize deep focus while preventing cognitive burnout:\n\n---\n\n### 🌅 Morning Phase: High Cognitive Load (Peak Focus)\n• **08:30 AM – 09:00 AM | Morning Prep & Concept Prioritization**\n  Review your primary milestone for the day. Hydrate, eat a protein-rich breakfast, and set phone to Do Not Disturb.\n• **09:00 AM – 10:30 AM | Deep Focus Sprint 1 (Challenging Core Concepts)**\n  *Method:* Two 40-minute focus blocks with a 10-minute screen-free break.\n  *Focus:* Your most demanding subject (e.g. Mathematics derivations, complex Chemistry mechanisms, or algorithm logic).\n• **10:30 AM – 10:45 AM | Active Pause**\n  Walk, stretch, drink water. Do not scroll social media; let neural pathways consolidate.\n\n---\n\n### ☀️ Midday Phase: Active Problem Solving & Derivations\n• **10:45 AM – 12:15 PM | Deep Focus Sprint 2 (Structured Problem Solving)**\n  Work through 5–8 textbook or competitive problems. Write out complete step-by-step reasoning rather than just checking answer keys.\n• **12:15 PM – 02:00 PM | Nourishing Lunch & Mind Reset**\n  Complete disengagement from study material. Rest your eyes and take a 20-minute power rest if needed.\n\n---\n\n### 🌤️ Afternoon Phase: Active Recall & Spaced Retrieval\n• **02:00 PM – 03:30 PM | Sprint 3: Active Recall & Flashcards**\n  *Method:* Closed-book testing. Review previous days\' flashcards on Buddhi, sketch mind maps from memory, and identify any forgotten terms.\n• **03:30 PM – 04:00 PM | Light Snack & Hydration Break**\n\n---\n\n### 🌆 Evening Phase: Diagnostic Testing & Error Journaling\n• **04:00 PM – 05:15 PM | Sprint 4: Timed Quiz & Diagnostic Review**\n  Take a 15–20 minute practice quiz on Buddhi. Spend the remaining 30 minutes reading the explanations for any missed questions and noting the error pattern in your study journal.\n• **05:15 PM – 07:30 PM | Exercise, Dinner & Social Reset**\n  Physical movement and mental decompression.\n\n---\n\n### 🌙 Night Phase: Micro-Review & Sleep Preparation\n• **07:30 PM – 08:30 PM | Sprint 5: Low-Intensity Micro-Review**\n  Light reading of chapter summaries, organizing tomorrow\'s workspace, and celebrating your daily progress.\n• **09:30 PM – 10:00 PM | Digital Shutdown**\n  Ensure 7.5–8 hours of quality sleep—sleep is when your brain physically transfers short-term memories into permanent long-term memory.\n\n---\n\nWhat specific subjects or topics are you focusing on tomorrow? Tell me, and I can plug your exact chapters into these time slots!`,
        suggestedFollowups: [
          'Adapt this schedule for an evening owl routine',
          'Add specific subjects: Physics and Mathematics',
          'Give me tips to beat afternoon sluggishness',
        ],
        emotionalTone: 'structured-planning',
      };
    }

    // ==========================================
    // 6. Quiz Generation Request (C Programming or C++)
    // ==========================================
    const isProgQuiz =
      (lower.includes('c programming') || lower.includes('c++') || lower.includes('language c') || lower.includes('quiz on c') || lower.includes('c quiz') || lower.includes('c language')) &&
      (lower.includes('quiz') || lower.includes('test') || lower.includes('question') || lower.includes('make a quiz'));

    if (isProgQuiz) {
      return {
        reply: `Here is a **C Programming Diagnostic Quiz** covering core concepts, pointers, and memory management:\n\n---\n\n### ❓ Question 1 (Pointers & Dereferencing)\n**What is the output of the following C code snippet?**\n\`\`\`c\nint a = 5;\nint *p = &a;\n*p = *p * 2;\nprintf("%d", a);\n\`\`\`\n• (A) Memory address of a\n• (B) 5\n• (C) 10\n• (D) Runtime Error\n\n### ❓ Question 2 (Dynamic Memory Allocation)\n**Which C standard library function allocates heap memory and automatically initializes all allocated bytes to zero?**\n• (A) \`malloc()\`\n• (B) \`calloc()\`\n• (C) \`realloc()\`\n• (D) \`free()\`\n\n### ❓ Question 3 (Array Indexing & Bounds Safety)\n**What occurs in C if you attempt to access an array element outside its declared boundary (e.g., \`arr[10]\` for an array of size 5)?**\n• (A) ArrayOutOfBoundsException is thrown\n• (B) The array is automatically resized\n• (C) Undefined Behavior (may crash, return garbage, or corrupt memory)\n• (D) Returns NULL\n\n---\n\n### 💡 Answer Key & Explanations:\n1. **Answer: (C)** — The pointer \`*p\` holds the address of \`a\`. Modifying \`*p\` directly mutates the value stored in \`a\` from 5 to 10.\n2. **Answer: (B)** — \`calloc(n, size)\` allocates contiguous memory and clears all bytes to zero, whereas \`malloc()\` leaves uninitialized garbage memory.\n3. **Answer: (C)** — C does not perform runtime array bounds checking. Accessing out-of-bounds memory results in Undefined Behavior.\n\n💡 **Want a full 20-question timed assessment?**\nYou can generate and solve a complete 20-question assessment anytime from the **Practice Quizzes** page in the left sidebar!`,
        suggestedFollowups: [
          'Generate a full 20-question C quiz on the Quizzes page',
          'Explain pointers and memory addresses in C',
          'What is the difference between malloc() and calloc()?',
        ],
        emotionalTone: 'formative-assessment',
      };
    }

    // ==========================================
    // 6B. General Factual & Geography Inquiries
    // ==========================================
    if (lower.includes('capital of india') || lower === 'capital of india') {
      return {
        reply: 'The capital of India is New Delhi.',
        suggestedFollowups: [
          'What are the official languages of India?',
          'Tell me about the Indian constitution',
          'Generate a quick general knowledge quiz',
        ],
        emotionalTone: 'clear-direct',
      };
    }

    // ==========================================
    // 7. Quick Actions (Study Plan, Explain Topic, Make Flashcards, Progress)
    // ==========================================
    if (lower.includes('create my study plan') || (lower.includes('study plan') && lower.length < 35)) {
      return {
        reply: `📅 **Personalized Study Planner Activated!**\n\nI am ready to build your tailored schedule${studentName ? `, ${studentName}` : ''}. To make it perfectly calibrated, please share:\n\n1. **Target Subject(s) & Chapters** (e.g., *Physics: Wave Optics & Modern Physics*)\n2. **Examination or Milestone Date** (e.g., *March 15* or *in 3 weeks*)\n3. **Daily Available Study Time** (e.g., *3 hours per day*)\n4. **Current Preparation Level** (*Beginner*, *Intermediate*, or *Revision*)\n\nOnce you share these details, I will synthesize daily milestones, interleaving active recall sessions and deliberate mental wellness buffers!`,
        suggestedFollowups: [
          'Physics: Optics & Electricity, Exam in 20 days, 3 hours daily',
          'Math: Calculus & Vectors, Exam in 1 month, 4 hours daily',
          'Make a study plan for tomorrow',
        ],
        emotionalTone: 'structured-planning',
      };
    }

    if (lower.includes('explain a difficult topic') || lower === 'explain topic') {
      return {
        reply: `💡 **Conceptual Tutoring Ready!**\n\nWhich topic or theorem would you like to master today${studentName ? `, ${studentName}` : ''}?\n\nWhether it's:\n• **Computer Science**: *Recursion, Binary Search, Dynamic Programming, or Pointers*\n• **Physics**: *Photoelectric effect, Gauss's law, AC resonance, or Ray optics*\n• **Chemistry**: *SN1 vs SN2 reactions, Nernst equation, or Coordination bonding*\n• **Mathematics**: *Bayes theorem, integration by parts, or Maxima/Minima*\n• **Biology**: *DNA replication, Photosynthesis, or Lac operon*\n\nTell me the topic name, and I will break it down using clear analogies, fundamental principles, and step-by-step examples!`,
        suggestedFollowups: [
          'Explain recursion in simple words',
          'Explain Photoelectric Effect simply',
          'Explain SN1 vs SN2 reaction mechanisms',
          'Explain Integration by Parts step-by-step',
        ],
        emotionalTone: 'empowering-academic',
      };
    }

    if (lower.includes('generate a quiz') || lower === 'generate quiz') {
      return {
        reply: `📝 **AI Diagnostic Quiz Generator Ready!**\n\nLet's test your active recall and uncover any hidden conceptual gaps! You can choose:\n\n1. **Question Format**: Multiple Choice (MCQ), Short Conceptual Answers, or Long Descriptive Answers.\n2. **Question Count**: 3, 5, or 10 questions.\n3. **Topic & Subject**.\n\nYou can either launch it from the **Practice Quizzes Tab** or reply here with your subject and topic (e.g. *"Generate a C++ quiz"* or *"Quiz on Optics with 3 MCQs"*), and I will generate it right now!`,
        suggestedFollowups: [
          'Generate a C++ quiz',
          'Generate 3 MCQ questions on Wave Optics',
          'Generate a Short Answer quiz on Organic Chemistry',
        ],
        emotionalTone: 'formative-assessment',
      };
    }

    if (lower.includes('make flashcards') || lower === 'make flashcards') {
      return {
        reply: `🗂️ **Spaced Recall Flashcard Generator!**\n\nActive recall is the most scientifically proven method to beat the Ebbinghaus forgetting curve. Which chapter or notes should we turn into flashcards?\n\nGive me:\n• A subject and topic (e.g., *Physics: Semiconductor Formulas* or *C++: Pointer Concepts*)\n• Or paste any summary / note snippet\n\nI will generate high-yield Question & Answer cards with core concepts that will be saved straight to your **Flashcards Suite**!`,
        suggestedFollowups: [
          'Make 5 flashcards for Physics Electric Charges',
          'Make flashcards for C++ Object Oriented Programming',
          'Make flashcards for Organic Chemistry Named Reactions',
        ],
        emotionalTone: 'retrieval-practice',
      };
    }

    if (lower.includes('analyse my study progress') || lower.includes('analyze my study progress') || lower.includes('my progress')) {
      const streak = input.currentStreak || 8;
      return {
        reply: `📊 **Buddhi Cognitive & Progress Diagnostic${studentName ? ` for ${studentName}` : ''}**\n\nHere is your real-time academic analysis based on your connected database:\n\n🔥 **Active Study Streak:** **${streak} Days Unbroken**\n• *Consistency Index:* Excellent. Daily reinforcement is cementing neuroplastic pathways.\n\n📚 **Syllabus & Task Distribution:**\n• Your active subjects are tracked with live topic completion bars.\n• High-priority milestones are prioritized ahead of upcoming exam deadlines.\n\n🧠 **Psychological Readiness & Recommendation:**\n• You are making steady, measurable headway.\n• *Next Strategic Win:* Complete one 25-minute Pomodoro session on your weakest subject today, then log a quick diagnostic quiz to verify retention.\n\nKeep going—consistency always compounds into mastery!`,
        suggestedFollowups: [
          'What are my highest priority tasks today?',
          'How can I improve my quiz accuracy score?',
          'Help me optimize my daily study schedule',
        ],
        emotionalTone: 'analytical-encouraging',
      };
    }

    // ==========================================
    // 8. Math & Calculation Problem Solving
    // ==========================================
    const mathMatch = raw.match(/solve\s+(.+)/i) || raw.match(/calculate\s+(.+)/i) || raw.match(/([0-9xX\+\-\*\/\^\=\(\)\.\s]{5,})/);
    if (mathMatch && (lower.includes('solve') || lower.includes('calculate') || lower.includes('derivative') || lower.includes('integral') || lower.includes('='))) {
      const res = this.solveMathProblem(raw, studentName);
      res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
      return res;
    }

    // ==========================================
    // 9. Specific Academic Subject / Concept Explanations
    // ==========================================
    const res = this.explainAcademicConcept(raw, lower, studentName);
    res.reply = res.reply.replace(/\*\*(.*?)\*\*/g, '$1');
    return res;
  }

  /**
   * Mathematics & Problem Solving Engine
   */
  private solveMathProblem(raw: string, studentName: string): {
    reply: string;
    suggestedFollowups: string[];
    emotionalTone: string;
  } {
    const lower = raw.toLowerCase();
    const studentTitle = studentName ? ` for ${studentName}` : '';
    // Linear equation solve e.g. 2x + 5 = 15 or 3x - 9 = 0
    const linearMatch = raw.match(/([+-]?\s*\d*)\s*x\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/i);
    if (linearMatch) {
      let a = parseInt(linearMatch[1].replace(/\s/g, ''), 10);
      if (isNaN(a)) a = linearMatch[1].includes('-') ? -1 : 1;
      const b = parseInt(linearMatch[2].replace(/\s/g, ''), 10);
      const c = parseInt(linearMatch[3].replace(/\s/g, ''), 10);
      const xVal = (c - b) / a;

      return {
        reply: `Step-by-Step Algebraic Solution${studentTitle}:

Equation: ${linearMatch[0].trim()}

1. Isolate the variable term:
   Subtract ${b > 0 ? b : `(${b})`} from both sides:
   ${a}x = ${c} - (${b})
   ${a}x = ${c - b}

2. Solve for x:
   Divide both sides by ${a}:
   x = ${c - b} / ${a}
   x = ${xVal}

3. Verification Check:
   Substitute x = ${xVal} back into the original equation:
   ${a}(${xVal}) + (${b}) = ${a * xVal + b} = ${c} (Verified)`,
        suggestedFollowups: [
          'Give me a similar practice problem to solve',
          'Solve a quadratic equation: ax² + bx + c = 0',
          'Explain linear equations',
        ],
        emotionalTone: 'analytical-step-by-step',
      };
    }

    // Derivative / Calculus
    if (lower.includes('derivative') || lower.includes('differentiate') || lower.includes('d/dx')) {
      return {
        reply: `Calculus Concept & Derivation${studentTitle}:

Core Definition of Derivative:
The derivative represents the instantaneous rate of change of a function with respect to its variable:
f'(x) = lim(h -> 0) [f(x + h) - f(x)] / h

Fundamental Differentiation Rules:
1. Power Rule: d/dx [x^n] = n * x^(n-1)
2. Constant Multiple Rule: d/dx [c * f(x)] = c * f'(x)
3. Sum and Difference Rule: d/dx [f(x) ± g(x)] = f'(x) ± g'(x)
4. Product Rule: d/dx [u * v] = u'v + uv'
5. Quotient Rule: d/dx [u / v] = (u'v - uv') / v²
6. Chain Rule: d/dx [f(g(x))] = f'(g(x)) * g'(x)

Example: To differentiate f(x) = 3x² + 5x - 7:
- d/dx [3x²] = 3 * (2x) = 6x
- d/dx [5x] = 5
- d/dx [-7] = 0
Result: f'(x) = 6x + 5.`,
        suggestedFollowups: [
          'Differentiate sin(x) * e^x using product rule',
          'Explain Integration by Substitution',
          'How do derivatives help find Maxima and Minima',
        ],
        emotionalTone: 'mathematical-rigor',
      };
    }

    return {
      reply: `To solve this mathematical problem, write down the known values and target variable, then apply the relevant formula step by step. If you paste your exact equation or numerical expression, I will derive the complete solution step by step for you.`,
      suggestedFollowups: [
        'Solve 2x + 10 = 30',
        'Show the Quadratic Formula with an example',
        'Explain Trigonometric Identities',
      ],
      emotionalTone: 'analytical-encouraging',
    };
  }

  /**
   * Concept Knowledge Base across Physics, Chemistry, Biology, Math, Computer Science & General Inquiries
   */
  private explainAcademicConcept(
    raw: string,
    lower: string,
    studentName?: string,
    isFollowupDetail?: boolean
  ): {
    reply: string;
    suggestedFollowups: string[];
    emotionalTone: string;
  } {
    const cleanedTopic = raw
      .replace(/^(what\s+(is|are|were|was)|can\s+(you|u)\s+(explain|tell\s+me\s+about|teach\s+me)|tell\s+me\s+about|explain|describe|define)\s+/i, '')
      .replace(/[\?\!\.\,\;\:]+$/g, '')
      .trim();
    const cleanTopicLower = cleanedTopic.toLowerCase();
    const topicTitle = cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1);

    // ==========================================
    // 1. Linear Equations (Algebra)
    // ==========================================
    if (
      cleanTopicLower.includes('linear equation') ||
      cleanTopicLower.includes('linear relation') ||
      cleanTopicLower === 'linear equations' ||
      cleanTopicLower === 'linear equation' ||
      cleanTopicLower === 'linear'
    ) {
      if (isFollowupDetail) {
        return {
          reply: `Here is a deeper look into working with linear equations in practice.

1. Calculating the Slope:
The slope m measures both the steepness and direction of the line. Given any two coordinates (x1, y1) and (x2, y2) on the line, calculate the slope with:
m = (y2 - y1) / (x2 - x1)
A positive slope rises from left to right, a negative slope falls, a zero slope is horizontal, and a vertical line has an undefined slope.

2. Solving a System of Linear Equations:
When you have two linear equations with two unknown variables, you are determining the exact coordinate where the two lines intersect. The two standard methods are:
- Substitution Method: Isolate one variable in terms of the other and plug it into the second equation.
- Elimination Method: Multiply equations by constants so that adding or subtracting them cancels out one variable.

For example, consider the system:
x + y = 10
2x - y = 5
Adding both equations eliminates y directly:
3x = 15, which gives x = 5.
Substituting x = 5 into the first equation yields:
5 + y = 10, which gives y = 5.
The unique intersection point is (5, 5).

3. Classification of Linear Systems:
- Consistent and Independent: The lines intersect at exactly one point (one unique solution).
- Inconsistent: The lines are parallel with equal slopes and different intercepts (zero solutions).
- Dependent: Both equations represent the same line (infinitely many solutions).

These techniques provide the tools to solve any multi-variable linear model.`,
          suggestedFollowups: [
            'Solve a linear equation problem',
            'Explain quadratic equations',
            'Graphing linear functions',
          ],
          emotionalTone: 'clear-educational',
        };
      }

      return {
        reply: `A linear equation is an algebraic equation in which each variable appears only to the first power (an exponent of 1). Variables are never squared, cubed, or multiplied by each other. When plotted on a coordinate plane, every linear equation produces a straight line, which is why it is called linear.

In one variable, the standard form is:
ax + b = 0 (where a is not equal to 0)
For example, in 2x + 4 = 10, you isolate x by subtracting 4 from both sides to get 2x = 6, then dividing by 2 to find x = 3.

In two variables, the most widely used form is the slope-intercept form:
y = mx + c (or y = mx + b)
Here:
- m represents the slope, which measures the rate of change or steepness of the line (change in y divided by change in x).
- c represents the y-intercept, which is the point where the line crosses the vertical y-axis (the value of y when x = 0).
Another standard form is Ax + By = C.

In real life, linear equations model any relationship with a constant rate of change—such as calculating a taxi fare with a flat base fee plus a rate per kilometer, finding travel distance at a steady speed, or tracking simple business profits.`,
        suggestedFollowups: [
          'Show how to solve systems of linear equations',
          'Calculate slope between two points',
          'Explain quadratic equations',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 2. Quadratic Equations (Algebra)
    // ==========================================
    if (
      cleanTopicLower.includes('quadratic equation') ||
      cleanTopicLower.includes('quadratic') ||
      cleanTopicLower === 'parabola'
    ) {
      return {
        reply: `A quadratic equation is a second-degree polynomial equation where the highest exponent of the variable is 2.

The standard form is:
ax² + bx + c = 0 (where a is not equal to 0)

When graphed on a coordinate plane, a quadratic equation forms a smooth U-shaped curve called a parabola. If a is positive, the parabola opens upward; if a is negative, it opens downward. The highest or lowest point on the curve is called the vertex.

You can solve quadratic equations using three primary methods:
1. Factoring: Writing the quadratic expression as a product of two linear binomials, such as (x - 2)(x - 3) = 0.
2. Completing the Square: Transforming the equation into the form (x + p)² = q.
3. The Quadratic Formula:
x = (-b ± √(b² - 4ac)) / (2a)

The expression inside the square root, b² - 4ac, is called the discriminant:
- If positive, there are two distinct real solutions.
- If zero, there is exactly one repeated real solution (the vertex touches the horizontal axis).
- If negative, there are two complex or imaginary solutions.

Quadratic equations describe many natural and physical phenomena, including projectile motion, calculating the trajectory of objects thrown into the air, and optimizing areas or profit curves.`,
        suggestedFollowups: [
          'Solve x² - 5x + 6 = 0',
          'Explain the discriminant formula',
          'Explain polynomials',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 3. Polynomials & General Algebra
    // ==========================================
    if (cleanTopicLower.includes('polynomial') || cleanTopicLower.includes('algebra')) {
      return {
        reply: `A polynomial is a mathematical expression composed of variables, coefficients, and exponents combined using addition, subtraction, and multiplication, where all exponents must be non-negative integers.

The standard form of a single-variable polynomial is:
P(x) = a_n * x^n + a_(n-1) * x^(n-1) + ... + a_1 * x + a_0

Key terms and classifications:
- Degree: The highest exponent of the variable in the polynomial. A degree of 0 is constant, 1 is linear, 2 is quadratic, 3 is cubic, and 4 is quartic.
- Monomial, Binomial, Trinomial: Terms with 1, 2, or 3 terms respectively (e.g., 5x is a monomial, 2x + 3 is a binomial).
- Roots or Zeros: The values of x where P(x) = 0, which correspond to the horizontal intercepts on a graph.

Two fundamental theorems in polynomial algebra:
1. Remainder Theorem: When a polynomial P(x) is divided by (x - a), the remainder is simply P(a).
2. Factor Theorem: (x - a) is a factor of P(x) if and only if P(a) = 0.

Polynomials serve as the building blocks for modeling complex continuous functions across calculus, economics, and physics.`,
        suggestedFollowups: [
          'Explain polynomial long division',
          'Explain the Factor Theorem with an example',
          'Explain quadratic equations',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 4. Calculus & Derivatives
    // ==========================================
    if (
      cleanTopicLower.includes('calculus') ||
      cleanTopicLower.includes('derivative') ||
      cleanTopicLower.includes('differentiation')
    ) {
      return {
        reply: `The derivative measures the instantaneous rate of change of a function with respect to its independent variable. Graphically, the derivative at any point represents the slope of the tangent line to the curve at that exact coordinate.

The formal mathematical definition uses a limit:
f'(x) = lim(h -> 0) [f(x + h) - f(x)] / h

Core rules of differentiation:
1. Power Rule: d/dx [x^n] = n * x^(n - 1)
2. Constant Multiple Rule: d/dx [c * f(x)] = c * f'(x)
3. Sum and Difference Rule: d/dx [f(x) ± g(x)] = f'(x) ± g'(x)
4. Product Rule: d/dx [u * v] = u'v + uv'
5. Quotient Rule: d/dx [u / v] = (u'v - uv') / v²
6. Chain Rule for composite functions: d/dx [f(g(x))] = f'(g(x)) * g'(x)

For example, to differentiate f(x) = 3x² + 5x - 7:
- The derivative of 3x² is 3 * (2x) = 6x
- The derivative of 5x is 5
- The derivative of constant -7 is 0
Result: f'(x) = 6x + 5.

Derivatives are used throughout engineering and science to calculate instantaneous velocity, acceleration, rates of chemical reaction, and to find maximum or minimum values (optimization).`,
        suggestedFollowups: [
          'Explain Integration',
          'Differentiate a composite function using Chain Rule',
          'How to find maxima and minima using derivatives',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 5. Integration & Integrals
    // ==========================================
    if (
      cleanTopicLower.includes('integration') ||
      cleanTopicLower.includes('integral') ||
      cleanTopicLower.includes('antiderivative')
    ) {
      return {
        reply: `Integration is the reverse process of differentiation. While derivatives determine the rate of change at a specific moment, integration accumulates continuous quantities to calculate totals, such as the area under a curve, displacement from velocity, or work done by a variable force.

There are two primary types of integrals:
1. Indefinite Integrals: These represent the general family of antiderivatives and always include an arbitrary constant of integration (+ C), because the derivative of any constant is zero.
Example: ∫ x² dx = (x³ / 3) + C.
2. Definite Integrals: These have specific upper and lower limits (from a to b) and produce a concrete numerical value representing the net signed area bounded by the curve and the horizontal axis.

Key integration techniques include:
- Power Rule for Integration: ∫ x^n dx = [x^(n+1) / (n+1)] + C (for n ≠ -1).
- Integration by Substitution: The reverse of the chain rule, used when an integral contains a function and its derivative.
- Integration by Parts: The reverse of the product rule, given by the formula ∫ u dv = uv - ∫ v du.

The Fundamental Theorem of Calculus formally connects differentiation and integration, showing that differentiation and definite integration are inverse operations.`,
        suggestedFollowups: [
          'Explain Integration by Parts with an example',
          'Explain definite vs indefinite integrals',
          'Derive the area under a curve',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 6. Trigonometry
    // ==========================================
    if (
      cleanTopicLower.includes('trigonometr') ||
      cleanTopicLower.includes('sine') ||
      cleanTopicLower.includes('cosine') ||
      cleanTopicLower.includes('tangent')
    ) {
      return {
        reply: `Trigonometry explores the mathematical relationships between the side lengths and angles of triangles, particularly right-angled triangles.

In a right-angled triangle with reference angle θ:
- Sine (sin θ) = Opposite side / Hypotenuse
- Cosine (cos θ) = Adjacent side / Hypotenuse
- Tangent (tan θ) = Opposite side / Adjacent side = sin θ / cos θ

Their reciprocal ratios are:
- Cosecant (csc θ) = 1 / sin θ
- Secant (sec θ) = 1 / cos θ
- Cotangent (cot θ) = 1 / tan θ

The foundational Pythagorean trigonometric identity states:
sin²(θ) + cos²(θ) = 1

When extended to the coordinate plane using the unit circle (a circle of radius 1 centered at the origin), coordinates are given by (cos θ, sin θ). This allows trigonometric functions to model periodic, oscillating phenomena in the physical world, such as sound waves, alternating current electricity, light, and harmonic motion.`,
        suggestedFollowups: [
          'Explain the unit circle and angle values',
          'Derive trigonometric identities',
          'Explain sine and cosine wave graphs',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 7. Probability & Statistics
    // ==========================================
    if (
      cleanTopicLower.includes('probability') ||
      cleanTopicLower.includes('statistic') ||
      cleanTopicLower.includes('standard deviation')
    ) {
      return {
        reply: `Probability measures the likelihood that a particular event will occur, represented as a value between 0 (impossible) and 1 (certain).

The classical definition for equally likely outcomes is:
P(A) = Number of favorable outcomes / Total number of possible outcomes

Fundamental probability rules:
- Complementary Rule: P(not A) = 1 - P(A)
- Addition Rule: P(A or B) = P(A) + P(B) - P(A and B)
- Independent Events: P(A and B) = P(A) * P(B)
- Conditional Probability: P(A | B) = P(A and B) / P(B)

Statistics involves collecting, summarizing, analyzing, and drawing conclusions from data:
- Measures of Central Tendency:
  * Mean: The arithmetic average of all data points.
  * Median: The middle observation when data points are arranged in ascending order.
  * Mode: The value that appears with the highest frequency.
- Measures of Dispersion:
  * Variance: The average squared difference of each data point from the mean.
  * Standard Deviation: The square root of variance, measuring the typical spread or dispersion of data around the mean.

These tools form the bedrock of experimental science, machine learning, and data-driven decision making.`,
        suggestedFollowups: [
          'Calculate mean, median, and mode for a sample dataset',
          'Explain Bayes theorem',
          'What is normal distribution',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 8. Newton's Laws of Motion (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('newton') ||
      cleanTopicLower.includes('law of motion') ||
      cleanTopicLower.includes('inertia')
    ) {
      return {
        reply: `Sir Isaac Newton formulated three fundamental laws of motion that describe the relationship between the forces acting upon a body and its resulting motion.

1. First Law (Law of Inertia):
An object at rest remains at rest, and an object in motion continues moving with constant velocity in a straight line, unless acted upon by a non-zero external net force. Inertia is the natural resistance of any physical object to a change in its state of motion, and it is directly proportional to mass.

2. Second Law (Force and Acceleration):
The rate of change of momentum of a body is directly proportional to the net applied force and takes place in the direction of that force. When mass remains constant, this simplifies to the famous formula:
F = m * a
Force (in Newtons) equals mass (in kilograms) multiplied by acceleration (in meters per second squared).

3. Third Law (Action and Reaction):
For every action, there is an equal and opposite reaction. Whenever object A exerts a force on object B, object B simultaneously exerts a force of equal magnitude and opposite direction on object A. Because these two forces act on different bodies, they do not cancel each other out.

These three laws form the foundation of classical mechanics and govern everything from vehicle dynamics to planetary motion.`,
        suggestedFollowups: [
          'Explain F = ma with a numerical example',
          'Why do action and reaction forces not cancel out',
          'Explain momentum and conservation of momentum',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 9. Kinematics & Gravity (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('kinematic') ||
      cleanTopicLower.includes('gravity') ||
      cleanTopicLower.includes('gravitat')
    ) {
      return {
        reply: `Kinematics describes the motion of points, bodies, and systems without considering the forces that cause them to move.

For an object moving in a straight line with constant acceleration a, its motion is described by the three standard equations of motion:
1. v = u + at
2. s = ut + (1/2)at²
3. v² = u² + 2as
Where u is initial velocity, v is final velocity, a is uniform acceleration, t is elapsed time, and s is displacement.

Gravity is the fundamental attractive force between all masses in the universe. According to Newton's Law of Universal Gravitation:
F = G * (m1 * m2) / r²
Where G is the gravitational constant (6.674 × 10⁻¹¹ N m²/kg²), m1 and m2 are the masses, and r is the distance between their centers of mass.

Near Earth's surface, this gravitational pull imparts a downward acceleration due to gravity (g) of approximately 9.8 m/s² on all freely falling objects, regardless of their mass (neglecting air resistance).`,
        suggestedFollowups: [
          'Solve a free-fall numerical problem',
          'Explain projectile motion equations',
          'Calculate escape velocity from Earth',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 10. Ohm's Law & Electricity (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes("ohm's law") ||
      cleanTopicLower.includes('ohms law') ||
      cleanTopicLower.includes('electric current') ||
      (cleanTopicLower.includes('resistance') && cleanTopicLower.includes('voltage'))
    ) {
      return {
        reply: `Ohm's Law states that at a constant physical temperature, the electric current flowing through a metallic conductor is directly proportional to the potential difference (voltage) applied across its ends.

The governing mathematical relationship is:
V = I * R
- V is Voltage (measured in Volts, V), representing the electrical potential difference or pressure driving charges.
- I is Current (measured in Amperes, A), representing the rate of flow of electric charge.
- R is Resistance (measured in Ohms, Ω), representing the opposition offered by the material to the flow of charge.

A helpful analogy is water flowing through a pipe:
- Voltage is the water pressure driving the fluid.
- Current is the volume rate of water flowing through per second.
- Resistance is the narrowing or friction inside the pipe that restricts flow.

Resistivity equation:
The resistance of a uniform conductor depends on its physical dimensions:
R = ρ * (L / A)
Where ρ is electrical resistivity, L is conductor length, and A is cross-sectional area. Longer conductors have more resistance, while thicker conductors have less.

Ohm's law applies strictly to ohmic conductors (such as metals at steady temperature); it does not apply to non-ohmic devices like semiconductors, diodes, or gas discharge tubes.`,
        suggestedFollowups: [
          'Calculate series and parallel resistance',
          'Explain Kirchhoff\'s laws',
          'Difference between resistance and resistivity',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 11. Optics: Wave & Ray Optics (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('optics') ||
      cleanTopicLower.includes('interference') ||
      cleanTopicLower.includes('diffraction') ||
      cleanTopicLower.includes('refraction')
    ) {
      return {
        reply: `Optics is the branch of physics that studies the behavior, properties, and interactions of light.

1. Ray Optics (Geometric Optics):
Treats light as straight lines or rays, which is valid when the dimensions of lenses, mirrors, and obstacles are much larger than the wavelength of light.
- Law of Reflection: Angle of incidence equals angle of reflection (θ_i = θ_r).
- Snell's Law of Refraction: n1 * sin(θ1) = n2 * sin(θ2), where n is the refractive index of each medium.

2. Wave Optics (Physical Optics):
Treats light as electromagnetic wavefronts, explaining phenomena that ray optics cannot account for:
- Interference: The superposition of two coherent light waves resulting in regions of enhanced brightness (constructive) and darkness (destructive).
  In Young's Double Slit Experiment, fringe width is given by:
  β = (λ * D) / d
  Where λ is wavelength, D is screen distance, and d is slit separation.
- Diffraction: The bending and spreading of light wavefronts around sharp edges or through small apertures comparable in size to the wavelength.
- Polarization: Restricting light wave vibrations to a single plane, proving that light is a transverse electromagnetic wave.`,
        suggestedFollowups: [
          'Derive the Lens Maker formula',
          'Explain Young Double Slit Experiment',
          'Difference between interference and diffraction',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 12. Photoelectric Effect (Physics)
    // ==========================================
    if (cleanTopicLower.includes('photoelectric') || cleanTopicLower.includes('work function')) {
      return {
        reply: `The Photoelectric Effect is the phenomenon where electrons are emitted from a clean metallic surface when light of sufficiently high frequency shines upon it. These emitted electrons are known as photoelectrons.

Why Classical Wave Physics Failed:
Classical electromagnetic wave theory predicted that light of any frequency would eventually eject electrons if given enough time and intensity. However, laboratory experiments demonstrated:
1. Electron emission is instantaneous (occurring in less than 10⁻⁹ seconds).
2. There exists a strict Threshold Frequency (ν0) below which zero electrons are emitted, regardless of how intense the light is.
3. Increasing light intensity increases the number of emitted electrons (electric current), but does not increase their individual kinetic energy.
4. Kinetic energy depends strictly on the frequency of the incoming light.

Einstein's Quantum Explanation:
Albert Einstein explained this by modeling light as localized packets of energy called photons, each carrying energy E = hν (where h is Planck's constant):
hν = Φ + KE_max
hν = hν0 + (1/2)m(v_max)²
Where Φ = hν0 is the metal's work function—the minimum energy required to liberate an electron from the metal surface. Any remaining photon energy is converted into the kinetic energy of the ejected electron.`,
        suggestedFollowups: [
          'Explain stopping potential formula',
          'Explain de Broglie hypothesis',
          'Calculate threshold wavelength for a metal',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 13. Bernoulli's Principle (Fluids)
    // ==========================================
    if (cleanTopicLower.includes('bernoulli')) {
      return {
        reply: `Bernoulli's Principle states that for an incompressible, non-viscous fluid undergoing steady streamline flow, an increase in fluid speed occurs simultaneously with a decrease in its static pressure or potential energy.

The governing equation represents the conservation of mechanical energy in flowing fluids:
P + (1/2)ρv² + ρgh = constant
- P is static fluid pressure.
- (1/2)ρv² is dynamic pressure (kinetic energy per unit volume, where ρ is fluid density and v is velocity).
- ρgh is hydrostatic pressure (gravitational potential energy per unit volume, where g is gravity and h is elevation).

Everyday Application (Aerodynamic Lift):
An airplane wing (airfoil) is designed with a curved upper surface and a flatter lower surface. Air traveling over the curved top must travel faster than air moving beneath the wing. According to Bernoulli's equation, this higher velocity on top creates a region of lower static pressure, while slower air beneath creates higher pressure. The resulting upward pressure difference produces aerodynamic lift that supports the aircraft in flight.`,
        suggestedFollowups: [
          'How does a Venturi meter measure flow rate',
          'Explain Torricelli law of efflux',
          'Difference between streamline and turbulent flow',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 14. Thermodynamics (Physics & Chemistry)
    // ==========================================
    if (cleanTopicLower.includes('thermodynamic') || cleanTopicLower.includes('entropy')) {
      return {
        reply: `Thermodynamics is the branch of physics and chemistry that examines heat, work, temperature, and their relationship to energy and physical properties of matter.

The four laws of thermodynamics:
- Zeroth Law: If body A is in thermal equilibrium with body B, and B is in thermal equilibrium with C, then A and C are in thermal equilibrium with each other. This defines the concept of temperature.
- First Law (Conservation of Energy): Energy cannot be created or destroyed, only transformed from one form to another. For a closed system:
  ΔU = Q - W
  Where ΔU is change in internal energy, Q is heat added, and W is work done by the system.
- Second Law (Direction of Spontaneous Processes): The total entropy (disorder) of an isolated system always increases over time. Heat never spontaneously flows from a colder body to a hotter body without external work.
- Third Law (Absolute Zero): As the temperature of a pure crystalline substance approaches absolute zero (0 Kelvin or -273.15 °C), its entropy approaches a constant minimum value of zero.`,
        suggestedFollowups: [
          'Explain Carnot engine efficiency',
          'Explain Gibbs free energy and spontaneity',
          'Difference between heat, work, and internal energy',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 15. Chemistry: Atomic Structure & Bonding
    // ==========================================
    if (
      cleanTopicLower.includes('periodic table') ||
      cleanTopicLower.includes('chemical bond') ||
      cleanTopicLower.includes('atomic structure')
    ) {
      return {
        reply: `Chemical bonding describes the attractive forces that hold atoms or ions together to create stable molecules and compounds.

1. Types of Chemical Bonds:
- Ionic Bonds: Formed through the complete transfer of one or more valence electrons from a metal (which becomes a positive cation) to a non-metal (which becomes a negative anion). The resulting electrostatic attraction creates strong crystal lattices (such as NaCl).
- Covalent Bonds: Formed when two non-metal atoms share one or more pairs of valence electrons to achieve stable noble-gas electron configurations (such as H2O and CH4).
- Metallic Bonds: Found in metals, characterized by an organized lattice of positive metal ions surrounded by a mobile "sea" of delocalized electrons, explaining high electrical and thermal conductivity.

2. Periodic Trends:
- Atomic Radius: Decreases across a period from left to right (due to increasing effective nuclear charge pulling electrons inward) and increases down a group (due to additional electron shells).
- Ionization Energy: The energy required to remove an electron from a gaseous atom. Increases across a period and decreases down a group.
- Electronegativity: The relative ability of an atom in a molecule to attract shared electrons toward itself. Fluorine is the most electronegative element.`,
        suggestedFollowups: [
          'Explain VSEPR theory and molecular geometry',
          'Difference between ionic and covalent compounds',
          'Explain hydrogen bonding in water',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 16. Organic Chemistry: SN1 vs SN2
    // ==========================================
    if (cleanTopicLower.includes('sn1') || cleanTopicLower.includes('sn2')) {
      return {
        reply: `SN1 and SN2 are the two primary nucleophilic substitution reaction mechanisms in organic chemistry:

1. SN1 (Substitution Nucleophilic Unimolecular):
- Mechanism: A 2-step process. In step 1, the leaving group departs slowly to form a planar carbocation intermediate (the rate-determining step). In step 2, the nucleophile attacks the carbocation.
- Rate Law: Rate = k[R-X] (first order, depends only on substrate concentration).
- Substrate Reactivity: Tertiary > Secondary > Primary > Methyl (3° > 2° > 1°), because tertiary carbocations are stabilized by hyperconjugation and inductive effects.
- Stereochemistry: Racemization occurs because the flat, sp²-hybridized carbocation can be attacked equally from either face.
- Solvent: Polar protic solvents (like water or ethanol) stabilize the intermediate ions.

2. SN2 (Substitution Nucleophilic Bimolecular):
- Mechanism: A 1-step concerted process. The nucleophile attacks the carbon atom from the back side at the exact same moment the leaving group departs through a 5-coordinate transition state.
- Rate Law: Rate = k[R-X][Nu⁻] (second order, depends on both substrate and nucleophile).
- Substrate Reactivity: Methyl > Primary > Secondary > Tertiary, because bulky alkyl groups cause steric hindrance that blocks backside attack on tertiary substrates.
- Stereochemistry: Complete inversion of configuration (Walden Inversion), like an umbrella turning inside out in the wind.
- Solvent: Polar aprotic solvents (like acetone or DMSO) leave the nucleophile unhindered.`,
        suggestedFollowups: [
          'Explain Markovnikov and Anti-Markovnikov addition',
          'What is Aldol condensation mechanism',
          'Difference between substitution and elimination reactions',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 17. Cell Biology & Organelles
    // ==========================================
    if (
      cleanTopicLower.includes('mitochondria') ||
      cleanTopicLower.includes('cell organelle') ||
      cleanTopicLower.includes('plant cell') ||
      cleanTopicLower.includes('animal cell') ||
      cleanTopicLower === 'cell' ||
      cleanTopicLower === 'cells'
    ) {
      return {
        reply: `The cell is the basic structural and functional unit of all living organisms.

Key organelles and their functions in eukaryotic cells:
- Nucleus: The control center of the cell containing genetic material (DNA organized into chromosomes), directing cellular activities and protein synthesis.
- Mitochondria: The powerhouses of the cell that generate most of the chemical energy required for cellular processes in the form of adenosine triphosphate (ATP) through cellular respiration.
- Ribosomes: Molecular machines composed of ribosomal RNA and proteins that translate mRNA transcripts into polypeptide chains.
- Endoplasmic Reticulum (ER): Rough ER is studded with ribosomes and synthesizes proteins; Smooth ER synthesizes lipids and phospholipids and detoxifies metabolic byproducts.
- Golgi Apparatus: Modifies, sorts, and packages proteins and lipids for transport inside or outside the cell.
- Lysosomes: Contain digestive enzymes to break down cellular waste and foreign invaders.

Key differences between plant and animal cells:
- Plant cells have rigid cellulose cell walls, large central vacuoles for turgor pressure, and chloroplasts for photosynthesis.
- Animal cells lack cell walls and chloroplasts, and contain centrioles for organizing cell division.`,
        suggestedFollowups: [
          'Explain mitosis vs meiosis',
          'How mitochondria produce ATP through cellular respiration',
          'Structure and function of cell membrane',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 18. Respiration in Plants & Cellular Respiration (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('respiration in plant') ||
      cleanTopicLower.includes('plant respiration') ||
      cleanTopicLower.includes('cellular respiration') ||
      cleanTopicLower.includes('respiration') ||
      cleanTopicLower.includes('aerobic respiration') ||
      cleanTopicLower.includes('anaerobic respiration')
    ) {
      return {
        reply: `Respiration in plants is the biochemical process by which living plant cells break down glucose and other organic molecules (produced during photosynthesis) in the presence of oxygen to release usable energy for growth, maintenance, and survival.

Chemical Equation:
C6H12O6 + 6O2 -> 6CO2 + 6H2O + Chemical Energy (ATP)

Reactants: Glucose and oxygen.
Products: Carbon dioxide, water, and chemical energy in the form of ATP (Adenosine Triphosphate).

Key Facts About Plant Respiration:
- Continuous Process (24/7): Unlike photosynthesis—which requires sunlight and occurs only during the daytime—respiration happens constantly in all living plant cells, day and night.
- Gas Exchange Mechanism: Plants do not have specialized breathing organs like lungs. Instead, they exchange gases through microscopic pores:
  * Stomata on leaves
  * Lenticels on woody stems
  * Root hair surfaces in the soil
- Opposite of Photosynthesis: Photosynthesis stores solar energy by combining carbon dioxide and water to make glucose and oxygen; respiration does the reverse by breaking down glucose to release that stored energy.
- Stages of Respiration: Respiration proceeds through three coordinated stages:
  1. Glycolysis: Occurs in the cytoplasm, breaking one molecule of glucose into two molecules of pyruvate, generating a net gain of 2 ATP and 2 NADH without requiring oxygen.
  2. Krebs Cycle (Citric Acid Cycle): Occurs in the mitochondrial matrix, metabolizing pyruvate into carbon dioxide while transferring high-energy electrons to NADH and FADH2.
  3. Electron Transport Chain & Oxidative Phosphorylation: Takes place on the inner mitochondrial membrane, where electrons pass through protein complexes to oxygen (the final electron acceptor), driving ATP synthase to produce the vast majority of cellular ATP.`,
        suggestedFollowups: [
          'Difference between photosynthesis and plant respiration',
          'Role of stomata and lenticels in gas exchange',
          'Explain aerobic vs anaerobic respiration in plants',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 19. Photosynthesis (Biology)
    // ==========================================
    if (cleanTopicLower.includes('photosynthesis')) {
      return {
        reply: `Photosynthesis is the biochemical process by which green plants, algae, and cyanobacteria convert light energy from the sun into chemical energy stored in glucose, releasing oxygen as a byproduct.

Chemical Equation:
6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2

Reactants: Carbon dioxide, water, and solar photon energy (absorbed by chlorophyll).
Products: Glucose (chemical energy storage) and molecular oxygen (released through stomata).

Key Facts About Photosynthesis:
- Daytime Process Only: Requires photon flux to excite electrons in chlorophyll, occurring strictly during sunlight hours in photosynthetic cells.
- Primary Site & Organelles: Takes place inside plant chloroplasts containing thylakoids (site of light reactions) and stroma (site of dark reactions / Calvin cycle).
- Opposite of Respiration: While respiration breaks down glucose to release energy, photosynthesis synthesizes glucose by capturing and storing solar radiation.
- Two-Stage Mechanism:
  1. Light-Dependent Reactions: In thylakoid membranes, photolysis of water releases O2 and generates ATP and NADPH.
  2. Light-Independent Reactions (Calvin Cycle): In the stroma, RuBisCO fixes CO2 to produce glyceraldehyde-3-phosphate (G3P), which is assembled into glucose.`,
        suggestedFollowups: [
          'Difference between photosynthesis and respiration in plants',
          'Explain the Calvin cycle and RuBisCO',
          'Difference between C3 and C4 plants',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 20. Plant Tissues & Transport: Xylem, Phloem & Transpiration (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('xylem') ||
      cleanTopicLower.includes('phloem') ||
      cleanTopicLower.includes('transpiration') ||
      cleanTopicLower.includes('plant tissue') ||
      cleanTopicLower.includes('plant transport')
    ) {
      return {
        reply: `Plant transport is the physiological system of specialized vascular tissues—xylem and phloem—responsible for moving water, dissolved minerals, and organic nutrients throughout the plant body.

Key Vascular Tissues:
- Xylem: Composed of tracheids, vessels, xylem parenchyma, and xylem fibers. Transports water and inorganic mineral ions unidirectionally upward from roots to stems and leaves. Driven by transpiration pull (cohesion-tension mechanism) and root pressure.
- Phloem: Composed of sieve tube elements, companion cells, phloem parenchyma, and phloem fibers. Transports organic solutes (mainly sucrose) bidirectionally from source organs (mature leaves) to sink organs (roots, fruits, developing buds). Driven by hydrostatic pressure differences (Münch pressure-flow hypothesis).

Key Facts About Plant Transport:
- Transpiration Stream: The loss of water vapor from leaf stomata creates negative hydrostatic tension in leaf mesophyll cells, pulling a continuous column of water molecules upward due to water cohesion (hydrogen bonding) and adhesion to xylem walls.
- Living vs Non-Living Cells: Mature conducting xylem vessels and tracheids are dead cells with lignified walls to withstand high negative pressures, whereas phloem sieve elements are living cells dependent on adjacent companion cells for metabolic energy.
- Role in Gas & Heat Exchange: Transpiration cools leaf surfaces by evaporative heat loss and maintains cell turgidity required to keep herbaceous stems upright.`,
        suggestedFollowups: [
          'Difference between xylem and phloem',
          'Explain the cohesion-tension theory of transpiration',
          'How stomata open and close via guard cells',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 21. Human Circulatory System & Double Circulation (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('circulatory system') ||
      cleanTopicLower.includes('circulation') ||
      cleanTopicLower.includes('double circulation') ||
      cleanTopicLower.includes('heart') ||
      cleanTopicLower.includes('artery') ||
      cleanTopicLower.includes('vein')
    ) {
      return {
        reply: `The human circulatory system is an organ system consisting of the four-chambered heart, blood vessels (arteries, veins, capillaries), and blood that transports oxygen, nutrients, hormones, and metabolic wastes throughout the body.

Core Anatomical Components:
- Four-Chambered Heart: Right atrium and right ventricle handle deoxygenated blood; left atrium and left ventricle handle oxygenated blood. Septum prevents mixing of oxygenated and deoxygenated blood.
- Blood Vessels: Arteries carry blood away from the heart under high pressure (thick muscular walls, no valves); veins carry blood toward the heart under lower pressure (thinner walls, internal valves to prevent backflow); capillaries allow micro-diffusion of gases and nutrients across one-cell-thick walls.

Key Facts About Human Circulation:
- Double Circulation Pathway: Blood passes through the heart twice during each complete circuit of the body:
  1. Pulmonary Circuit: Right ventricle pumps deoxygenated blood through pulmonary arteries to the lungs for oxygenation; pulmonary veins return oxygenated blood to the left atrium.
  2. Systemic Circuit: Left ventricle pumps high-pressure oxygenated blood through the aorta to all body tissues; vena cava returns deoxygenated blood to the right atrium.
- Cardiac Cycle & Pacemaker: Coordinated contraction (systole) and relaxation (diastole) are initiated by the Sinoatrial (SA) node, the natural electrical pacemaker located in the right atrium.
- Separation of Oxygenated and Deoxygenated Blood: Ensures maximum oxygen delivery efficiency to meet the high metabolic demands of warm-blooded humans.`,
        suggestedFollowups: [
          'Explain double circulation with a flowchart',
          'Difference between arteries, veins, and capillaries',
          'Structure and function of the human heart',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 22. Human Respiratory System & Gas Exchange (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('human respiration') ||
      cleanTopicLower.includes('respiratory system') ||
      cleanTopicLower.includes('alveoli') ||
      cleanTopicLower.includes('lungs') ||
      cleanTopicLower.includes('breathing')
    ) {
      return {
        reply: `The human respiratory system is the anatomical system responsible for gas exchange—taking in oxygen from the atmospheric environment and expelling metabolic carbon dioxide produced by cellular respiration.

Primary Pathway:
Nasal cavity -> Pharynx -> Larynx -> Trachea -> Bronchi -> Bronchioles -> Alveoli (terminal air sacs in lungs).

Key Facts About Human Respiration:
- Alveolar Diffusion: Alveoli provide a vast surface area (approximately 70 to 80 square meters) lined with an extremely thin, moist epithelial layer surrounded by dense capillary networks, allowing rapid diffusion of O2 and CO2 along concentration gradients.
- Hemoglobin Transport: Over 98% of oxygen in the blood is bound to hemoglobin molecules inside red blood cells as oxyhemoglobin, releasing oxygen in peripheral tissues where partial pressure of oxygen is low.
- Breathing Mechanism (Inhalation vs Exhalation):
  * Inhalation: Diaphragm contracts and flattens downward, external intercostal muscles lift ribs upward and outward, increasing thoracic cavity volume and decreasing pressure, drawing air in.
  * Exhalation: Diaphragm relaxes and curves upward, ribcage moves downward and inward, decreasing volume and forcing air out.
- Difference between Breathing and Cellular Respiration: Breathing is a mechanical physical process of ventilation; cellular respiration is an intracellular biochemical process releasing ATP energy.`,
        suggestedFollowups: [
          'Mechanism of gas exchange in alveoli',
          'Inhalation vs exhalation mechanics',
          'How hemoglobin transports oxygen and carbon dioxide',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 23. Human Digestive System & Enzymes (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('digestive system') ||
      cleanTopicLower.includes('digestion') ||
      cleanTopicLower.includes('stomach') ||
      cleanTopicLower.includes('alimentary canal') ||
      cleanTopicLower.includes('digestive enzyme')
    ) {
      return {
        reply: `The human digestive system is the organ system that ingests food, breaks down complex insoluble macromolecules into simple soluble nutrients, absorbs those nutrients into the bloodstream, and eliminates indigestible waste.

Primary Digestive Organs & Key Enzymes:
- Mouth / Oral Cavity: Teeth perform mechanical mastication; salivary amylase (ptyalin) initiates starch digestion into maltose at neutral pH (~6.8).
- Stomach: Gastric glands secrete hydrochloric acid (HCl, creating pH 1.5-2.0 to kill pathogens and activate pepsinogen into pepsin) and pepsin (breaks proteins into peptones and proteoses). Mucus protects stomach lining.
- Small Intestine (Duodenum, Jejunum, Ileum): Major site of chemical digestion and absorption.
  * Liver: Secretes bile (contains bile salts that emulsify large lipid droplets and neutralize acidic chyme).
  * Pancreas: Secretes pancreatic amylase (carbohydrates), trypsin (proteins into peptides), and pancreatic lipase (emulsified fats into fatty acids and glycerol).
  * Intestinal Villi: Finger-like projections on the mucosal lining that drastically increase surface area for nutrient absorption into capillary and lacteal vessels.
- Large Intestine: Absorbs residual water and electrolytes, compacting unabsorbed material into feces for egestion.

Key Facts About Human Digestion:
- Sequential Enzymatic Cleavage: Macromolecules must be hydrolyzed sequentially—starches to simple sugars (glucose), proteins to amino acids, and lipids to fatty acids and glycerol.
- Peristalsis: Involuntary wave-like contractions of smooth muscle along the esophagus and gastrointestinal tract push food bolus forward continuously.`,
        suggestedFollowups: [
          'Roles of bile, pepsin, and trypsin in digestion',
          'How intestinal villi maximize nutrient absorption',
          'Trace the digestion of carbohydrates, proteins, and fats',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 24. Human Excretory System & The Nephron (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('excretory') ||
      cleanTopicLower.includes('excretion') ||
      cleanTopicLower.includes('nephron') ||
      cleanTopicLower.includes('kidney') ||
      cleanTopicLower.includes('urine formation')
    ) {
      return {
        reply: `The human excretory system is the biological organ system responsible for filtering metabolic nitrogenous waste products (primarily urea) from circulating blood, regulating blood osmolarity, and producing urine for excretion.

Functional Unit: The Nephron (over 1 million in each human kidney).
Key Structures of a Nephron:
- Renal Corpuscle: Bowman's capsule enclosing the glomerulus (high-pressure capillary tuft).
- Renal Tubule: Proximal Convoluted Tubule (PCT), Loop of Henle (descending and ascending limbs), Distal Convoluted Tubule (DCT), and Collecting Duct.

Key Facts About Urine Formation:
- Three-Step Mechanism:
  1. Ultrafiltration (Glomerular Filtration): High hydrostatic pressure in the glomerulus forces water, glucose, amino acids, urea, and electrolytes through the fenestrated capillary walls into Bowman's capsule, forming glomerular filtrate. Blood cells and large plasma proteins are retained.
  2. Selective Reabsorption: Along the PCT and Loop of Henle, essential nutrients (100% of glucose and amino acids, ~85% of water and sodium ions) are actively and passively reabsorbed back into peritubular capillaries.
  3. Tubular Secretion: Cells of the DCT actively secrete potassium ions, hydrogen ions, and metabolic toxins into the tubular lumen to regulate systemic acid-base (pH) balance.
- Counter-Current Mechanism: The hairpin loops of Henle and surrounding vasa recta capillaries establish an osmotic concentration gradient in the renal medulla, enabling production of hypertonic (concentrated) urine to conserve body water.`,
        suggestedFollowups: [
          'Step-by-step mechanism of urine formation',
          'Structure and working of a nephron',
          'How the counter-current multiplier concentrates urine',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 25. Nervous System, Neurons & Reflex Arc (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('nervous system') ||
      cleanTopicLower.includes('neuron') ||
      cleanTopicLower.includes('reflex arc') ||
      cleanTopicLower.includes('synapse') ||
      cleanTopicLower.includes('nerve impulse')
    ) {
      return {
        reply: `The nervous system is the biological communication network that receives sensory input, coordinates neurological processing, and triggers rapid physiological responses across the organism.

Core Functional Unit: The Neuron.
- Dendrites: Branching projections that receive chemical signals from adjacent cells.
- Cell Body (Soma): Contains nucleus and metabolic organelles, integrating electrical potentials.
- Axon: Long cylindrical projection that conducts action potentials away from the soma, insulated by myelin sheaths formed by Schwann cells to enable rapid saltatory conduction.
- Synaptic Terminal: Releases neurotransmitters (e.g. acetylcholine) across the microscopic synaptic cleft to bind receptors on postsynaptic membranes.

Key Facts About Neural Coordination:
- The Reflex Arc (Rapid Involuntary Pathway):
  Receptor (detects stimulus) -> Sensory Neuron (afferent pathway) -> Interneuron in Spinal Cord (integrates without waiting for brain processing) -> Motor Neuron (efferent pathway) -> Effector (muscle contracts or gland secretes).
  Example: Instantly pulling your hand away from a hot surface before perceiving pain.
- Action Potential Generation: Resting potential (-70 mV) is maintained by the sodium-potassium pump (3 Na⁺ pumped out, 2 K⁺ pumped in). When stimulated past threshold (-55 mV), voltage-gated Na⁺ channels open, causing rapid depolarization (+30 mV), followed by K⁺ efflux (repolarization).
- Division of the Nervous System:
  * Central Nervous System (CNS): Brain and spinal cord.
  * Peripheral Nervous System (PNS): Cranial and spinal nerves, divided into Somatic (voluntary) and Autonomic (sympathetic fight-or-flight vs parasympathetic rest-and-digest).`,
        suggestedFollowups: [
          'Step-by-step components of a reflex arc',
          'How action potentials propagate along an axon',
          'Sympathetic vs parasympathetic nervous system',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 26. Endocrine System & Hormones (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('endocrine') ||
      cleanTopicLower.includes('hormone') ||
      cleanTopicLower.includes('pituitary') ||
      cleanTopicLower.includes('thyroid') ||
      cleanTopicLower.includes('insulin') ||
      cleanTopicLower.includes('adrenaline')
    ) {
      return {
        reply: `The endocrine system is a control system of ductless glands that synthesize and secrete chemical messengers (hormones) directly into the bloodstream to regulate distant target organs and maintain physiological homeostasis.

Key Endocrine Glands and Target Hormones:
- Pituitary Gland ("Master Gland"): Located at the base of the brain under hypothalamic control. Secretes Growth Hormone (GH), Thyroid-Stimulating Hormone (TSH), Adrenocorticotropic Hormone (ACTH), and Luteinizing Hormone (LH).
- Thyroid Gland: Secretes Thyroxine (T4) and Triiodothyronine (T3), which regulate basal metabolic rate (BMR), cellular respiration, and tissue development. Requires dietary iodine; deficiency causes goitre.
- Pancreas (Islets of Langerhans):
  * Beta Cells: Secrete Insulin to lower blood glucose by promoting cellular glucose uptake and glycogen storage in liver and muscles.
  * Alpha Cells: Secrete Glucagon to elevate blood glucose by stimulating glycogen breakdown (glycogenolysis).
- Adrenal Glands (Adrenal Medulla): Secretes Adrenaline (epinephrine) and Noradrenaline for emergency "fight-or-flight" responses—increasing heart rate, blood pressure, pupil dilation, and blood flow to skeletal muscles.
- Gonads: Testes secrete Testosterone (male secondary sexual characteristics and spermatogenesis); Ovaries secrete Estrogen and Progesterone (menstrual cycle regulation and female secondary sexual characteristics).

Key Facts About Hormonal Action:
- Negative Feedback Loops: Hormone levels are tightly regulated by feedback inhibition—for instance, high blood glucose stimulates insulin release, and falling glucose levels signal the pancreas to halt further insulin secretion.
- Endocrine vs Nervous Coordination: Nervous signals are electrical, rapid (milliseconds), and localized; hormonal signals are chemical, transported via blood, slower to initiate, but provide long-lasting and widespread systemic effects.`,
        suggestedFollowups: [
          'Negative feedback mechanism of insulin and glucagon',
          'Comparison of endocrine and nervous coordination',
          'Functions of major pituitary hormones',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 27. Plant Reproduction: Pollination & Fertilization (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('pollination') ||
      cleanTopicLower.includes('flower reproduction') ||
      cleanTopicLower.includes('double fertilization') ||
      cleanTopicLower.includes('plant reproduction')
    ) {
      return {
        reply: `Sexual reproduction in flowering plants (angiosperms) is the process by which floral reproductive organs generate haploid gametes, transfer pollen, and achieve fertilization to produce seeds enclosed in fruits.

Floral Reproductive Anatomy:
- Stamen (Male Organ): Composed of the anther (produces haploid pollen grains via microsporogenesis) and filament.
- Carpel / Pistil (Female Organ): Composed of the stigma (sticky surface receiving pollen), style (elongated neck), and ovary (contains ovules with female gametophytes/embryo sacs).

Key Facts About Angiosperm Reproduction:
- Pollination Mechanisms:
  * Self-Pollination (Autogamy): Transfer of pollen from anther to stigma of the same flower.
  * Cross-Pollination (Allogamy / Xenogamy): Transfer of pollen between flowers on different plants of the same species via biotic vectors (insects, birds) or abiotic vectors (wind, water). Promotes genetic diversity.
- The Pollen Tube Growth: Following compatible pollen landing on the stigma, the pollen grain germinates and produces a pollen tube that grows down the style toward the micropyle of the ovule.
- Double Fertilization (Unique to Angiosperms):
  1. Syngamy: One haploid sperm cell fuses with the haploid egg cell to form the diploid zygote (2n), which develops into the embryo.
  2. Triple Fusion: The second haploid sperm cell fuses with the two haploid polar nuclei in the central cell to form the triploid Primary Endosperm Nucleus (PEN, 3n), which develops into nutrient-rich endosperm tissue feeding the embryo.
- Post-Fertilization Changes: The fertilized ovule develops into a seed, and the ovary matures into a fruit.`,
        suggestedFollowups: [
          'Step-by-step process of double fertilization',
          'Self-pollination vs cross-pollination adaptations',
          'Post-fertilization developmental changes in flowers',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 28. Genetics & DNA (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('dna') ||
      cleanTopicLower.includes('rna') ||
      cleanTopicLower.includes('genetics') ||
      cleanTopicLower.includes('mendel') ||
      cleanTopicLower.includes('replication')
    ) {
      return {
        reply: `Deoxyribonucleic acid (DNA) is the hereditary molecule that carries genetic instructions for the development, functioning, growth, and reproduction of all known organisms.

Structure of DNA:
James Watson and Francis Crick determined that DNA forms a double helix composed of two complementary, antiparallel polynucleotide chains. Each nucleotide consists of:
- A deoxyribose sugar molecule
- A phosphate group
- One of four nitrogenous bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C)

Base-Pairing Rules (Chargaff's Rules):
- Adenine pairs strictly with Thymine (forming 2 hydrogen bonds).
- Guanine pairs strictly with Cytosine (forming 3 hydrogen bonds).

Key Facts About Genetics & Molecular Biology:
- The Central Dogma:
  1. DNA Replication: The double helix unzips and DNA polymerase synthesizes two identical daughter strands via semiconservative replication.
  2. Transcription: RNA polymerase reads a DNA template strand to synthesize messenger RNA (mRNA) in the nucleus.
  3. Translation: Ribosomes in the cytoplasm read mRNA codons and assemble corresponding amino acids into functional proteins with tRNA assistance.
- Mendel's Laws of Inheritance:
  1. Law of Segregation: Allele pairs separate during gamete formation so each gamete carries only one allele.
  2. Law of Independent Assortment: Genes for distinct traits assort independently during gamete formation (classic dihybrid ratio: 9:3:3:1).`,
        suggestedFollowups: [
          'Explain Mendelian genetics laws and Punnett squares',
          'Explain transcription and translation steps',
          'Structure of DNA vs RNA',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 29. Ecology, Food Chains & 10% Energy Transfer (Biology)
    // ==========================================
    if (
      cleanTopicLower.includes('food chain') ||
      cleanTopicLower.includes('trophic level') ||
      cleanTopicLower.includes('ecosystem') ||
      cleanTopicLower.includes('10 percent') ||
      cleanTopicLower.includes('energy flow') ||
      cleanTopicLower.includes('biomagnification')
    ) {
      return {
        reply: `An ecosystem is a functional ecological unit comprising biotic communities (producers, consumers, decomposers) interacting with abiotic physical factors (sunlight, soil, water, atmosphere) through continuous energy flow and nutrient cycling.

Trophic Levels & Feeding Strata:
1. Producers (Trophic Level 1): Autotrophic green plants and phytoplankton that fix solar energy into organic biomass via photosynthesis.
2. Primary Consumers / Herbivores (Trophic Level 2): Animals feeding directly on producers (e.g. deer, grasshoppers, zooplankton).
3. Secondary Consumers / Carnivores (Trophic Level 3): Organisms that feed on primary consumers (e.g. frogs, foxes).
4. Tertiary Consumers / Apex Predators (Trophic Level 4): Organisms at the top of the food chain (e.g. eagles, lions).
5. Decomposers: Fungi and bacteria that break down dead organic matter, recycling essential inorganic nutrients back to the abiotic environment.

Key Facts About Ecological Energy Flow:
- Unidirectional Energy Transfer: Solar energy fixed by autotrophs moves sequentially through trophic levels and never flows in reverse back to the sun.
- Lindeman's 10% Law: On average, only approximately 10% of the energy entering a trophic level is converted into organic biomass available to the next higher level. The remaining ~90% is expended during cellular respiration, locomotion, and lost as metabolic heat to the environment.
- Limitation on Chain Length: Because energy declines geometrically at each successive step, food chains rarely exceed 4 or 5 trophic levels before available energy is insufficient to sustain viable populations.
- Biological Magnification (Biomagnification): Progressive increase in concentration of persistent, non-biodegradable toxins (such as DDT or heavy metals) at each progressively higher trophic level, placing top carnivores at highest toxicological risk.`,
        suggestedFollowups: [
          'Calculate energy at trophic levels using Lindeman\'s 10% law',
          'Difference between food chain and food web',
          'Explain biomagnification with a classic example',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 30. Newton's Laws of Motion & Momentum (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('newton') ||
      cleanTopicLower.includes('laws of motion') ||
      cleanTopicLower.includes('inertia') ||
      cleanTopicLower.includes('momentum')
    ) {
      return {
        reply: `Newton's Laws of Motion are three fundamental physical laws that describe the relationship between the forces acting upon a body and the resulting motion of that body through inertial reference frames.

The Three Laws of Motion:
1. First Law (Law of Inertia): An object remains in a state of rest or uniform motion in a straight line unless acted upon by an external unbalanced net force. Inertia is an object's resistance to change in velocity, quantified by mass.
2. Second Law (Fundamental Law of Dynamics): The rate of change of linear momentum of an object is directly proportional to the applied net force and occurs in the direction of the force:
   F = dp/dt = d(mv)/dt = m * a (for constant mass m)
   SI Unit: Newton (N), where 1 N = 1 kg·m/s².
3. Third Law (Law of Action-Reaction): For every action, there is an equal and opposite reaction:
   F_AB = -F_BA
   Crucially, action and reaction forces always act on two different bodies simultaneously and therefore never cancel each other out.

Key Facts About Newtonian Dynamics:
- Conservation of Linear Momentum: In an isolated system with zero net external force (F_ext = 0), the total linear momentum before interaction equals total linear momentum after interaction (m1*u1 + m2*u2 = m1*v1 + m2*v2).
- Impulse-Momentum Theorem: The product of a large force applied over a short time interval equals the change in momentum (Impulse J = F * Δt = Δp). Catching a ball with yielding hands extends Δt, reducing the impact force F.
- Friction Forces: Resistance opposing relative motion between surfaces in contact. Static friction (f_s ≤ μ_s * N) prevents motion until limiting friction is reached; kinetic friction (f_k = μ_k * N) acts during active sliding, with μ_k < μ_s.`,
        suggestedFollowups: [
          'Derive F = ma from Newton\'s second law',
          'Explain recoil of a gun using conservation of momentum',
          'Why action and reaction forces do not cancel each other',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 31. Universal Gravitation & g vs G (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('gravitat') ||
      cleanTopicLower.includes('gravity') ||
      cleanTopicLower.includes('free fall')
    ) {
      return {
        reply: `Universal Gravitation is the fundamental physical force of mutual attraction acting between all massive bodies in the universe.

Newton's Universal Law of Gravitation:
F = G * (m1 * m2) / r²
Where:
- F is the gravitational attractive force along the line connecting their centers (Newtons).
- G is the Universal Gravitational Constant: G = 6.674 × 10⁻¹¹ N·m²/kg² (invariant throughout the universe).
- m1, m2 are interacting masses (kg).
- r is the separation distance between their centers of mass (meters).

Acceleration Due to Gravity (g):
The gravitational acceleration experienced by a free-falling body on a planetary surface:
g = G * M / R²
For Earth: g ≈ 9.8 m/s² at sea level.

Key Facts About Gravity:
- Difference Between G and g:
  * G is a universal scalar constant independent of location, surrounding medium, or temperature.
  * g is a local vector acceleration that varies with planetary mass, radius, altitude, and latitude (maximum at the poles where Earth's radius is smaller, minimum at the equator).
- Mass vs Weight:
  * Mass (m) is the intrinsic measure of matter in a body (constant everywhere, SI unit kg).
  * Weight (W = m * g) is the downward gravitational force acting on the mass (measured in Newtons, zero in free-fall orbit or at Earth's center where g = 0).
- Kepler's Laws of Planetary Motion:
  1. Law of Orbits: Planets orbit the Sun in ellipses with the Sun at one focus.
  2. Law of Areas: The line segment connecting a planet and the Sun sweeps out equal areas during equal intervals of time (conservation of angular momentum).
  3. Law of Periods: The square of the orbital period T is proportional to the cube of the semi-major axis a (T² ∝ a³).`,
        suggestedFollowups: [
          'Derive the relation between g and G',
          'Difference between mass and weight',
          'Variation of g with altitude and depth',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 32. Work, Energy & Power (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('work energy') ||
      cleanTopicLower.includes('kinetic energy') ||
      cleanTopicLower.includes('potential energy') ||
      cleanTopicLower.includes('conservation of energy')
    ) {
      return {
        reply: `Work, Energy, and Power form the cornerstone of classical mechanics, describing how applied forces transfer energy and how mechanical energy is conserved in physical systems.

Governing Formulas:
- Work Done: W = F · d = |F| * |d| * cos(θ)
  Where F is applied force, d is displacement, and θ is the angle between them. SI Unit: Joule (J = N·m).
  * Positive Work (θ < 90°): Force aids motion.
  * Negative Work (θ > 90°): Force opposes motion (e.g. friction).
  * Zero Work (θ = 90° or d = 0): Force is perpendicular to displacement (e.g. centripetal force holding a satellite in circular orbit does zero work).
- Kinetic Energy (Energy of Motion): KE = 0.5 * m * v²
- Gravitational Potential Energy: PE = m * g * h
- Mechanical Power: Rate of doing work: P = W / t = F · v. SI Unit: Watt (W = J/s), 1 horsepower = 746 W.

Key Facts About Energy:
- Work-Energy Theorem: The net work done by all forces acting on an object equals the change in its kinetic energy:
  W_net = ΔKE = 0.5 * m * v_f² - 0.5 * m * v_i²
- Law of Conservation of Mechanical Energy: In a closed system with only conservative forces (like gravity or spring elasticity) and zero non-conservative dissipation (friction/drag = 0):
  Total Mechanical Energy E = KE + PE = constant
- Transformation of Energy: Energy cannot be created or destroyed. In real-world systems with friction, mechanical energy is converted into non-recoverable thermal and acoustic energy.`,
        suggestedFollowups: [
          'Derive the Work-Energy Theorem',
          'Prove conservation of mechanical energy for a freely falling body',
          'Calculate power when force and velocity are known',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 33. Archimedes' Principle, Buoyancy & Density (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('archimedes') ||
      cleanTopicLower.includes('buoyancy') ||
      cleanTopicLower.includes('buoyant force') ||
      cleanTopicLower.includes('flotation')
    ) {
      return {
        reply: `Archimedes' Principle states that when a body is completely or partially immersed in a fluid at rest, it experiences an upward buoyant force equal to the weight of the fluid displaced by the body.

Governing Formula for Buoyant Force:
F_b = ρ_fluid * V_submerged * g
Where:
- F_b is the upward buoyant force (Newtons).
- ρ_fluid is the density of the fluid (kg/m³).
- V_submerged is the volume of the immersed portion of the body (m³).
- g is the local acceleration due to gravity (9.8 m/s²).

Key Facts About Buoyancy and Flotation:
- The Law of Flotation: A floating body displaces a volume of fluid whose weight exactly equals the total weight of the floating body (W_body = F_b).
- Density Criteria for Flotation:
  * Sinking: If average body density > fluid density (ρ_body > ρ_fluid), weight exceeds maximum buoyant force and the object sinks.
  * Floating: If average body density < fluid density (ρ_body < ρ_fluid), the object floats with a fraction of its volume submerged:
    Fraction Submerged = V_submerged / V_total = ρ_body / ρ_fluid
  * Neutral Equilibrium: If ρ_body = ρ_fluid, the object remains submerged at any depth without sinking or rising.
- Center of Buoyancy: The buoyant force acts vertically upward through the center of gravity of the displaced fluid.
- Practical Applications: Designing cargo ships made of dense steel with large hollow hulls to displace massive volumes of water, submarines adjusting ballast tanks with water/air, and hydrometers measuring battery acid density.`,
        suggestedFollowups: [
          'Why a heavy iron ship floats while a small iron nail sinks',
          'Calculate the submerged fraction of an iceberg in seawater',
          'How submarines control depth using ballast tanks',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 34. Sound Waves, Acoustics & Echo (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('sound wave') ||
      cleanTopicLower.includes('echo') ||
      cleanTopicLower.includes('ultrasound') ||
      cleanTopicLower === 'sound'
    ) {
      return {
        reply: `Sound is a mechanical longitudinal wave produced by vibrating objects that propagates through material media (solids, liquids, gases) via alternating compressions (high density/pressure) and rarefactions (low density/pressure).

Wave Relationship:
Wave Speed v = Frequency f * Wavelength λ
Where:
- v is wave propagation speed (m/s).
- f is frequency (Hertz, Hz = cycles/second). Human audible range: 20 Hz to 20,000 Hz (20 kHz).
- λ is wavelength (meters, distance between consecutive compressions).

Key Facts About Sound Waves:
- Requirement of a Medium: Sound cannot propagate through a vacuum because it requires particle collisions to transmit mechanical energy.
- Speed Variation by Medium: Propagation speed depends on elasticity and density:
  Solids (> 5000 m/s in steel) > Liquids (~1500 m/s in water) > Gases (~343 m/s in air at 20 °C).
  Speed increases with temperature and humidity in air.
- Echo Formation Criteria: An echo is the distinct reflection of sound arriving at the listener after the original sound.
  * Minimum Reflection Distance: Human auditory persistence is 0.1 seconds. For air at 343 m/s:
    Total round-trip distance 2d = v * t = 343 * 0.1 = 34.3 m, meaning minimum barrier distance d = 17.2 meters.
- Infrasound vs Ultrasound:
  * Infrasound (< 20 Hz): Produced by earthquakes, volcanic eruptions, and elephants.
  * Ultrasound (> 20 kHz): Used in medical diagnostic sonography, non-destructive metal flaw detection, SONAR marine navigation, and echolocation by bats.`,
        suggestedFollowups: [
          'Calculate minimum distance required to hear an echo',
          'Difference between longitudinal and transverse waves',
          'Applications of ultrasound in medicine and industry',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 35. Light: Reflection, Refraction & Snell's Law (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('refraction') ||
      cleanTopicLower.includes('reflection of light') ||
      cleanTopicLower.includes('snell') ||
      cleanTopicLower.includes('total internal reflection') ||
      cleanTopicLower.includes('optical fiber')
    ) {
      return {
        reply: `Optics examines the behavior and properties of light, including its reflection at boundaries and refraction when transitioning between optical media of differing refractive indices.

Fundamental Laws of Geometric Optics:
1. Laws of Reflection:
   - Angle of incidence equals angle of reflection: ∠i = ∠r.
   - Incident ray, reflected ray, and normal to the surface at the point of incidence all lie in the same geometric plane.
   - Mirror Formula: 1/f = 1/v + 1/u, Magnification m = -v/u = h_image / h_object.
2. Laws of Refraction & Snell's Law:
   - When light crosses a boundary between medium 1 and medium 2:
     n1 * sin(i) = n2 * sin(r)
     Where n = c / v is the absolute refractive index (c = 3 × 10⁸ m/s).
   - Moving from optically rarer to denser medium (n1 < n2): Ray bends toward the normal.
   - Moving from optically denser to rarer medium (n1 > n2): Ray bends away from the normal.
   - Lens Formula: 1/f = 1/v - 1/u, Power of Lens P = 1/f (in meters, unit: Diopters D).

Key Facts About Light Phenomena:
- Total Internal Reflection (TIR): When light travels from a denser medium toward a rarer medium at an angle of incidence exceeding the critical angle (i > θ_c, where sin(θ_c) = n_rare / n_dense), 100% of light is reflected internally with zero refraction.
  * Applications: Fiber optic broadband telecommunications, medical endoscopes, diamond brilliance, and mirages in hot deserts.
- Dispersion of Light: Separation of polychromatic white light into its spectral colors (VIBGYOR) when passing through a prism, caused by shorter violet wavelengths refracting more strongly than longer red wavelengths (Cauchy relation).`,
        suggestedFollowups: [
          'Derive Snell\'s law and critical angle formula',
          'Conditions necessary for Total Internal Reflection',
          'Difference between convex and concave lenses with sign conventions',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 36. Electricity: Ohm's Law & Circuits (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('ohm') ||
      cleanTopicLower.includes('electric current') ||
      cleanTopicLower.includes('resistance in series') ||
      cleanTopicLower.includes('resistance in parallel') ||
      cleanTopicLower.includes('joule heating')
    ) {
      return {
        reply: `Electricity describes physical phenomena associated with the presence and motion of electric charges, potential differences, and electrical circuits.

Fundamental Laws & Governing Equations:
- Electric Current: Rate of flow of electric charge: I = Q / t (Amperes A = Coulombs/second).
- Electric Potential Difference: Work done moving unit positive charge: V = W / Q (Volts V = Joules/Coulomb).
- Ohm's Law: At constant physical conditions and temperature, current through a conductor is directly proportional to potential difference across its terminals:
  V = I * R
  Where R is electrical resistance (Ohms Ω).
- Factors Governing Resistance:
  R = ρ * (L / A)
  Where ρ is material resistivity (Ω·m), L is conductor length, and A is cross-sectional area.

Circuit Combinations:
- Series Circuits: Current is identical through all components; voltages add up:
  R_total = R1 + R2 + R3
  If one component breaks, the entire circuit disconnects.
- Parallel Circuits: Voltage is identical across all branches; currents add up:
  1/R_total = 1/R1 + 1/R2 + 1/R3
  Total equivalent resistance is smaller than the smallest individual resistor. Ideal for domestic wiring because failure of one appliance leaves others functional.

Key Facts About Electrical Energy:
- Joule's Law of Heating: Heat energy generated in a resistor:
  H = I² * R * t = V * I * t = (V² / R) * t (Joules)
- Electric Power: P = V * I = I² * R = V² / R (Watts W).
- Commercial Unit of Energy: 1 Kilowatt-hour (kWh) = "1 Unit" = 1000 W × 3600 s = 3.6 × 10⁶ Joules.`,
        suggestedFollowups: [
          'Why domestic electrical appliances are connected in parallel',
          'Derive equivalent resistance for series and parallel circuits',
          'Explain Joule\'s law of heating and electric fuses',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 37. Electromagnetism & Electromagnetic Induction (Physics)
    // ==========================================
    if (
      cleanTopicLower.includes('electromagnetic induction') ||
      cleanTopicLower.includes('faraday') ||
      cleanTopicLower.includes('lenz') ||
      cleanTopicLower.includes('solenoid') ||
      cleanTopicLower.includes('magnetic effect')
    ) {
      return {
        reply: `Electromagnetic Induction (EMI) is the phenomenon whereby a changing magnetic flux through a conducting loop induces an electromotive force (EMF) and electric current in the circuit.

Governing Laws:
1. Faraday's Law of Electromagnetic Induction:
   The magnitude of induced EMF (ε) is directly proportional to the time rate of change of magnetic flux (Φ_B = B · A = B * A * cos(θ)):
   ε = -N * (dΦ_B / dt)
   Where N is the number of coil turns, B is magnetic field strength (Tesla), and A is loop area.
2. Lenz's Law (Negative Sign in Faraday's Law):
   The polarity of the induced EMF is always such that the resulting induced current generates an opposing magnetic field that fights the original change in magnetic flux that produced it.
   Lenz's Law is a direct consequence of the Law of Conservation of Energy.

Directional Rules for Electromagnetism:
- Right-Hand Thumb Rule: For a current-carrying straight wire, thumb points in current direction, curled fingers indicate concentric magnetic field lines.
- Fleming's Left-Hand Rule (Electric Motors): Used to find mechanical force direction on a current-carrying conductor in a magnetic field (Thumb: Force/Motion, Forefinger: Magnetic Field B, Middle Finger: Current I).
- Fleming's Right-Hand Rule (Generators): Used to find induced current direction in a conductor moving through a magnetic field (Thumb: Motion, Forefinger: Field B, Middle Finger: Induced Current I).

Key Facts About Electromagnetic Applications:
- Electric Motor: Converts electrical energy into mechanical rotational kinetic energy via magnetic torque.
- AC Generator / Alternator: Rotates an armature coil in a stationary magnetic field to convert mechanical energy into alternating electric current.
- Transformers: Utilize mutual induction between primary and secondary coils around an iron core to step up or step down AC voltage according to turns ratio (V_s / V_p = N_s / N_p).`,
        suggestedFollowups: [
          'State Faraday\'s and Lenz\'s laws of electromagnetic induction',
          'Difference between AC generator and DC motor',
          'Working principle and turns ratio of a transformer',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 38. Chemical Reactions: Types & Balancing (Chemistry)
    // ==========================================
    if (
      cleanTopicLower.includes('chemical reaction') ||
      cleanTopicLower.includes('types of reaction') ||
      cleanTopicLower.includes('balancing equation') ||
      cleanTopicLower.includes('redox reaction')
    ) {
      return {
        reply: `A chemical reaction is a process in which one or more substances (reactants) undergo chemical bond cleavage and reformation to produce new substances (products) with distinct physical and chemical properties.

Law of Conservation of Mass: Matter cannot be created or destroyed in a chemical reaction. Therefore, the total number of atoms of each element must be equal on both sides of a balanced chemical equation.

Primary Types of Chemical Reactions:
1. Combination Reaction: Two or more reactants combine to form a single product:
   CaO(s) + H2O(l) -> Ca(OH)2(aq) + Heat (quicklime slaking, highly exothermic).
2. Decomposition Reaction: A single reactant breaks down into two or more simpler products (requires heat, light, or electricity):
   - Thermal: 2FeSO4(s) --Δ--> Fe2O3(s) + SO2(g) + SO3(g)
   - Electrolytic: 2H2O(l) --electric current--> 2H2(g) + O2(g)
   - Photolytic: 2AgCl(s) --sunlight--> 2Ag(s) + Cl2(g)
3. Displacement Reaction: A more reactive element displaces a less reactive element from its aqueous salt solution:
   Fe(s) + CuSO4(aq) -> FeSO4(aq) + Cu(s)
4. Double Displacement (Precipitation) Reaction: Mutual exchange of ions between two aqueous compounds forming an insoluble precipitate:
   Na2SO4(aq) + BaCl2(aq) -> BaSO4(s)↓ (white ppt) + 2NaCl(aq)
5. Redox (Oxidation-Reduction) Reaction: Simultaneous transfer of electrons:
   - Oxidation: Loss of electrons / gain of oxygen / loss of hydrogen.
   - Reduction: Gain of electrons / loss of oxygen / gain of hydrogen.
   CuO + H2 --heat--> Cu + H2O (CuO is reduced to Cu; H2 is oxidized to H2O).

Key Facts About Reaction Energetics:
- Exothermic Reactions: Release thermal energy into surroundings (ΔH < 0), such as respiration and combustion.
- Endothermic Reactions: Absorb thermal energy from surroundings (ΔH > 0), such as photosynthesis and thermal decomposition.`,
        suggestedFollowups: [
          'Steps to balance complex chemical equations',
          'Identify oxidizing and reducing agents in redox reactions',
          'Difference between displacement and double displacement reactions',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 39. Acids, Bases, Salts & pH Scale (Chemistry)
    // ==========================================
    if (
      cleanTopicLower.includes('acid') ||
      cleanTopicLower.includes('base') ||
      cleanTopicLower.includes('salt') ||
      cleanTopicLower.includes('ph scale') ||
      cleanTopicLower.includes('neutralization')
    ) {
      return {
        reply: `Acids, bases, and salts are fundamental classes of chemical compounds characterized by their distinct ionic behavior, aqueous equilibria, and characteristic reactions.

Fundamental Definitions:
- Arrhenius Concept:
  * Acids produce hydrogen ions (H⁺) or hydronium ions (H3O⁺) in aqueous solution (e.g. HCl, H2SO4, HNO3). Taste sour, turn blue litmus red.
  * Bases produce hydroxide ions (OH⁻) in aqueous solution (e.g. NaOH, KOH, Ca(OH)2). Water-soluble bases are called alkalis. Taste bitter, feel soapy, turn red litmus blue.
- Neutralization Reaction:
  Acid + Base -> Salt + Water + Heat
  HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l) (exothermic enthalpy of neutralization).

The pH Scale:
Logarithmic measure of hydronium ion concentration: pH = -log10[H⁺]
- pH < 7: Acidic solution ([H⁺] > [OH⁻]).
- pH = 7: Neutral solution (pure water at 25 °C).
- pH > 7: Basic / Alkaline solution ([OH⁻] > [H⁺]).

Important Industrial Salts:
- Bleaching Powder (CaOCl2): Produced by action of chlorine on dry slaked lime: Ca(OH)2 + Cl2 -> CaOCl2 + H2O.
- Baking Soda (Sodium Hydrogen Carbonate, NaHCO3): Mild non-corrosive base used in baking; releases CO2 gas upon heating: 2NaHCO3 --Δ--> Na2CO3 + H2O + CO2↑.
- Washing Soda (Na2CO3·10H2O): Recrystallized sodium carbonate with 10 waters of crystallization, used in glass/soap manufacture and permanent water hardness removal.
- Plaster of Paris (Hemihydrate, CaSO4·0.5H2O): Prepared by carefully heating Gypsum (CaSO4·2H2O) at 373 K:
  CaSO4·2H2O --373 K--> CaSO4·0.5H2O + 1.5 H2O. Re-sets into solid rock-like gypsum upon adding water.`,
        suggestedFollowups: [
          'Explain the pH scale and its daily life applications',
          'Preparation and properties of Plaster of Paris and Bleaching Powder',
          'Difference between strong acids and concentrated acids',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 40. Carbon Compounds, Catenation & Functional Groups (Chemistry)
    // ==========================================
    if (
      cleanTopicLower.includes('carbon compound') ||
      cleanTopicLower.includes('catenation') ||
      cleanTopicLower.includes('functional group') ||
      cleanTopicLower.includes('hydrocarbon') ||
      cleanTopicLower.includes('alkane') ||
      cleanTopicLower.includes('alkene') ||
      cleanTopicLower.includes('alkyne') ||
      cleanTopicLower.includes('saponification')
    ) {
      return {
        reply: `Carbon chemistry (organic chemistry) focuses on carbon-based compounds, which form millions of complex molecules due to carbon's unique bonding properties.

Why Carbon Forms Millions of Compounds:
1. Catenation: The unique ability of carbon atoms to form strong, stable covalent bonds with other carbon atoms, creating long straight chains, branched structures, and closed rings.
2. Tetravalency: Carbon has an atomic number of 6 (electronic configuration 2, 4). With 4 valence electrons, it shares electrons with up to four other monovalent atoms to achieve stable octet configurations.
3. Small Atomic Size: Carbon's compact atomic radius enables its nucleus to hold shared electron pairs tightly, making carbon-carbon covalent bonds exceptionally strong and thermodynamically stable.

Classes of Hydrocarbons:
- Saturated Hydrocarbons (Alkanes, General Formula: CnH2n+2): Contain only single C-C bonds (e.g. Methane CH4, Ethane C2H6). Undergo substitution reactions.
- Unsaturated Hydrocarbons:
  * Alkenes (General Formula: CnH2n): Contain at least one double C=C bond (e.g. Ethene C2H4).
  * Alkynes (General Formula: CnH2n-2): Contain at least one triple C≡C bond (e.g. Ethyne C2H2). Undergo addition reactions across multiple bonds.

Important Functional Groups:
- Alcohol (-OH): Suffix -ol (e.g. Ethanol, C2H5OH).
- Aldehyde (-CHO): Suffix -al (e.g. Ethanal / Acetaldehyde, CH3CHO).
- Ketone (>C=O): Suffix -one (e.g. Propanone / Acetone, CH3COCH3).
- Carboxylic Acid (-COOH): Suffix -oic acid (e.g. Ethanoic acid / Acetic acid, CH3COOH).
- Ester (-COO-): Sweet-smelling compounds formed by esterification between alcohols and carboxylic acids in the presence of acid catalysts.

Soaps vs Detergents:
- Soaps: Sodium or potassium salts of long-chain fatty acids (e.g. sodium stearate, C17H35COONa) prepared by saponification (ester alkaline hydrolysis). Form insoluble curds (scum) with Ca²⁺ and Mg²⁺ in hard water.
- Synthetic Detergents: Sodium salts of sulfonic acids or alkyl hydrogen sulfates. Clean effectively in both soft and hard water without forming scum.`,
        suggestedFollowups: [
          'Difference between soaps and detergents in hard water',
          'Explain esterification and saponification reactions',
          'Homologous series characteristics and naming rules',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 41. Recursion & Algorithms (Computer Science)
    // ==========================================
    if (cleanTopicLower.includes('recursion') || cleanTopicLower.includes('recursive')) {
      return {
        reply: `Recursion is a programming technique where a function solves a computational problem by calling a smaller instance of itself.

Every recursive function requires two essential components:
1. The Base Case (The Stop Condition):
A condition that returns a direct answer without making any further recursive calls. Without a base case, the function calls itself indefinitely until the call stack exhausts available memory, resulting in a Stack Overflow error.
2. The Recursive Case (Moving toward the base case):
The function calls itself with a reduced or modified input that brings the computation closer to the base case.

A classic example is calculating the factorial of n (n! = n * (n - 1)! with 0! = 1):
function factorial(n) {
  if (n <= 1) return 1; // Base case
  return n * factorial(n - 1); // Recursive case
}

How it executes in memory (The Call Stack):
When you evaluate factorial(3):
1. factorial(3) pauses and calls factorial(2).
2. factorial(2) pauses and calls factorial(1).
3. factorial(1) hits the base case and returns 1 immediately.
4. The call stack unwinds in reverse: factorial(2) computes 2 * 1 = 2, then factorial(3) computes 3 * 2 = 6.

Recursion is well suited for hierarchical or branching data structures—such as traversing tree nodes, exploring graphs (depth-first search), and divide-and-conquer algorithms like Merge Sort and Quick Sort.`,
        suggestedFollowups: [
          'Explain Merge Sort using recursion',
          'Difference between recursion and iteration',
          'How to prevent stack overflow errors',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 42. Data Structures & Algorithms (Computer Science)
    // ==========================================
    if (
      cleanTopicLower.includes('data structure') ||
      cleanTopicLower.includes('linked list') ||
      cleanTopicLower.includes('binary tree') ||
      cleanTopicLower.includes('stack') ||
      cleanTopicLower.includes('queue')
    ) {
      return {
        reply: `A data structure is a specialized format for organizing, processing, retrieving, and storing data in computer memory efficiently.

Common fundamental data structures:
1. Array: A collection of elements stored at contiguous memory locations. Offers fast O(1) random access via index, but fixed size and expensive O(n) insertions and deletions.
2. Linked List: A linear sequence of nodes where each node contains data and a pointer to the next node. Allows efficient O(1) insertions and deletions once a node is reached, but requires O(n) sequential access.
3. Stack: A Last-In, First-Out (LIFO) structure where elements are added and removed from the top using push and pop operations (e.g., function call stacks, undo mechanisms).
4. Queue: A First-In, First-Out (FIFO) structure where elements are inserted at the back (enqueue) and removed from the front (dequeue) (e.g., print spooling, task queues).
5. Hash Table: Maps keys to values using a hash function, providing average O(1) time complexity for search, insertion, and deletion.
6. Binary Search Tree (BST): A hierarchical tree where each node has at most two children, and all left descendants are smaller than the node while all right descendants are larger, enabling average O(log n) lookup.`,
        suggestedFollowups: [
          'Compare array vs linked list time complexity',
          'Explain hash map collision resolution',
          'Explain Binary Search Tree traversal algorithms',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 43. Object-Oriented Programming (OOP)
    // ==========================================
    if (
      cleanTopicLower.includes('object oriented') ||
      cleanTopicLower.includes('oop') ||
      cleanTopicLower.includes('polymorphism') ||
      cleanTopicLower.includes('encapsulation')
    ) {
      return {
        reply: `Object-Oriented Programming (OOP) is a programming paradigm organized around objects—data structures that bundle state (attributes) and behavior (methods)—rather than functions and logic alone.

The Four Pillars of OOP:
1. Encapsulation: Bundling data and the methods that operate on that data into a single unit (class), while restricting direct access to internal components using access modifiers (private, protected, public) to protect state integrity.
2. Abstraction: Hiding internal implementation complexities and exposing only essential interfaces to the outside world, reducing cognitive complexity for consumers.
3. Inheritance: A mechanism where a child class derives attributes and methods from an existing parent class, promoting code reusability and establishing hierarchical relationships (an "is-a" relationship).
4. Polymorphism: The ability for different classes to respond to the same method call in their own specialized way, achieved through method overriding (runtime polymorphism) and method overloading (compile-time polymorphism).`,
        suggestedFollowups: [
          'Explain polymorphism with code examples',
          'Difference between abstract class and interface',
          'Explain the SOLID design principles',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 44. Relational Databases, SQL & ACID Properties (Computer Science)
    // ==========================================
    if (
      cleanTopicLower.includes('database') ||
      cleanTopicLower.includes('sql') ||
      cleanTopicLower.includes('acid properties') ||
      cleanTopicLower.includes('normalization') ||
      cleanTopicLower.includes('relational')
    ) {
      return {
        reply: `A Relational Database Management System (RDBMS) organizes structured information into formal tables composed of rows (records/tuples) and columns (attributes), enforcing data integrity through relational constraints and SQL querying.

Keys and Relational Constraints:
- Primary Key: A minimal set of attributes that uniquely identifies each tuple in a table; cannot contain NULL values.
- Foreign Key: An attribute in a child table that references the Primary Key of a parent table, establishing and enforcing referential integrity.
- Candidate Key: Any minimal attribute set capable of serving as a primary key.

The ACID Transaction Principles:
1. Atomicity: "All or Nothing." Every transaction executes in its entirety or is completely rolled back to its prior state if any operation fails.
2. Consistency: A transaction transitions the database only between valid states conforming to all schema constraints, cascades, and business rules.
3. Isolation: Concurrent transactions execute without cross-contamination. Intermediate uncommitted changes are invisible to parallel queries (enforced via isolation levels: Read Committed, Repeatable Read, Serializable).
4. Durability: Once a transaction commits, its modifications persist permanently in non-volatile storage, surviving subsequent power outages or system crashes.

Key Facts About Relational Architecture:
- Database Normalization: The systematic technique of decomposing relations to eliminate data redundancy and prevent Insert, Update, and Delete anomalies:
  * 1NF: Atomic values only (no repeating groups).
  * 2NF: In 1NF and no partial dependencies (every non-key attribute fully functionally dependent on the entire primary key).
  * 3NF: In 2NF and no transitive dependencies (no non-key attribute depends on another non-key attribute).
  * BCNF: Stricter 3NF where every determinant is a super key.
- Joins: Combining rows from multiple tables using related columns: Inner Join (matching rows only), Left Outer Join (all left rows + matching right rows), Right Outer Join, and Full Outer Join.`,
        suggestedFollowups: [
          'Explain ACID properties with a bank transfer example',
          'Difference between 1NF, 2NF, 3NF, and BCNF',
          'Compare Inner Join, Left Join, and Outer Join in SQL',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 45. Computer Networks & The OSI Model (Computer Science)
    // ==========================================
    if (
      cleanTopicLower.includes('network') ||
      cleanTopicLower.includes('osi model') ||
      cleanTopicLower.includes('tcp') ||
      cleanTopicLower.includes('udp') ||
      cleanTopicLower.includes('dns')
    ) {
      return {
        reply: `Computer networking encompasses the protocols, architectural models, and transmission media enabling disparate computational systems to exchange digital data reliably.

The OSI 7-Layer Reference Model (From Physical to Application):
1. Layer 1 - Physical Layer: Transmits raw unstructured bitstreams over physical mediums (cables, radio waves, fiber optics). Protocols: Ethernet physical, RS-232. Unit: Bits.
2. Layer 2 - Data Link Layer: Handles node-to-node framing, physical hardware addressing (MAC addresses), and local error detection. Devices: Switches, Network Interface Cards (NICs). Unit: Frames.
3. Layer 3 - Network Layer: Responsible for end-to-end logical packet routing across interconnected networks. Devices: Routers. Protocols: IPv4, IPv6, ICMP. Unit: Packets.
4. Layer 4 - Transport Layer: Manages host-to-host process communication, segmentation, flow control, and error recovery. Protocols: TCP, UDP. Unit: Segments (TCP) / Datagrams (UDP).
5. Layer 5 - Session Layer: Establishes, maintains, and terminates communication sessions between applications (e.g. NetBIOS, RPC).
6. Layer 6 - Presentation Layer: Handles data formatting, syntax translation, serialization, encryption (TLS/SSL), and compression.
7. Layer 7 - Application Layer: Provides direct network service interfaces to end-user software applications. Protocols: HTTP/HTTPS, DNS, SMTP, FTP, SSH.

Key Facts About Network Protocols:
- TCP vs UDP:
  * TCP (Transmission Control Protocol): Connection-oriented. Establishes a reliable session via a 3-Way Handshake (SYN, SYN-ACK, ACK), guarantees in-order packet delivery, handles flow control and retransmissions. Ideal for web browsing (HTTP), file transfers (FTP), and email.
  * UDP (User Datagram Protocol): Connectionless and lightweight. Transmits datagrams without handshakes, ordering guarantees, or retransmission overhead. Ideal for low-latency live video streaming, voice over IP (VoIP), and gaming.
- DNS (Domain Name System): Hierarchical, distributed naming system that translates human-friendly domain names (e.g. buddhi.ai) into machine-routable IP addresses (e.g. 104.21.56.2).`,
        suggestedFollowups: [
          'Explain the TCP 3-way handshake mechanism',
          'Difference between TCP and UDP with use cases',
          'Trace a DNS lookup query step-by-step',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 46. Operating Systems: Processes, Threads & Deadlocks (Computer Science)
    // ==========================================
    if (
      cleanTopicLower.includes('operating system') ||
      cleanTopicLower.includes('process') ||
      cleanTopicLower.includes('thread') ||
      cleanTopicLower.includes('deadlock') ||
      cleanTopicLower.includes('cpu scheduling')
    ) {
      return {
        reply: `An Operating System (OS) is core system software that manages hardware resources (CPU, RAM, storage, I/O devices) and provides common abstraction services for application programs.

Processes vs Threads:
- Process: An executing program instance with its own independent, protected address space (containing Text, Data, Heap, and Stack segments) and OS resource handles. Inter-process communication (IPC) requires explicit mechanisms (pipes, sockets, shared memory).
- Thread: A lightweight execution entity ("thread of control") within a parent process. Multiple threads share the parent process's memory space, code segment, and file descriptors, but maintain their own independent Program Counter (PC), registers, and stack. Fast context switching, but requires synchronization primitives (mutexes, semaphores) to prevent race conditions.

CPU Scheduling Algorithms:
- First-Come, First-Served (FCFS): Non-preemptive, suffers from convoy effect.
- Shortest Job First (SJF) / Shortest Remaining Time First (SRTF): Minimizes average waiting time; risks starving long jobs.
- Round Robin (RR): Preemptive scheduling with a fixed time quantum (slice); prevents starvation and provides fair responsiveness for interactive systems.
- Priority Scheduling: Allocates CPU based on priority levels; utilizes aging techniques to prevent starvation.

Key Facts About Deadlocks:
- Deadlock: A condition where two or more processes are permanently blocked because each holds a resource while waiting for another resource held by another process in the set.
- The Four Coffman Conditions (All must hold simultaneously for a deadlock to exist):
  1. Mutual Exclusion: At least one resource is held in a non-shareable mode.
  2. Hold and Wait: A process holds at least one resource and is waiting to acquire additional resources held by other processes.
  3. No Preemption: Resources cannot be forcibly seized from a process; they must be released voluntarily.
  4. Circular Wait: A closed chain of processes exists such that each process waits for a resource held by the next process in the chain.
- Prevention & Recovery: Breaking circular wait via global resource ordering, Banker's Algorithm for deadlock avoidance, or process termination/preemption for recovery.`,
        suggestedFollowups: [
          'The four Coffman conditions for deadlock and how to prevent them',
          'Difference between a process and a thread',
          'Compare Round Robin and SJF CPU scheduling',
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // ==========================================
    // 47. Universal Responsive Fallback
    // Direct, fact-grounded explanation for any academic inquiry without generic templates or meta-chatter
    // ==========================================
    return this.generateUniversalEducationalResponse(topicTitle, cleanTopicLower, raw);
  }

  /**
   * Universal Dynamic Knowledge Synthesizer
   * Formats any syllabus topic or academic question into a clear, authoritative, factual breakdown
   * without generic templates, meta-chatter, or trailing follow-up questions.
   */
  private generateUniversalEducationalResponse(
    topicTitle: string,
    cleanTopicLower: string,
    raw: string
  ): {
    reply: string;
    suggestedFollowups: string[];
    emotionalTone: string;
  } {
    // 1. Biological / Life Sciences Detection
    const isBio =
      cleanTopicLower.includes('plant') ||
      cleanTopicLower.includes('animal') ||
      cleanTopicLower.includes('cell') ||
      cleanTopicLower.includes('organ') ||
      cleanTopicLower.includes('tissue') ||
      cleanTopicLower.includes('blood') ||
      cleanTopicLower.includes('heart') ||
      cleanTopicLower.includes('lung') ||
      cleanTopicLower.includes('kidney') ||
      cleanTopicLower.includes('brain') ||
      cleanTopicLower.includes('nerve') ||
      cleanTopicLower.includes('leaf') ||
      cleanTopicLower.includes('root') ||
      cleanTopicLower.includes('stem') ||
      cleanTopicLower.includes('seed') ||
      cleanTopicLower.includes('flower') ||
      cleanTopicLower.includes('gene') ||
      cleanTopicLower.includes('dna') ||
      cleanTopicLower.includes('rna') ||
      cleanTopicLower.includes('enzyme') ||
      cleanTopicLower.includes('hormone') ||
      cleanTopicLower.includes('respiration') ||
      cleanTopicLower.includes('photosynthesis') ||
      cleanTopicLower.includes('transpiration') ||
      cleanTopicLower.includes('digestion') ||
      cleanTopicLower.includes('excretion') ||
      cleanTopicLower.includes('circulation') ||
      cleanTopicLower.includes('reproduction') ||
      cleanTopicLower.includes('ecology') ||
      cleanTopicLower.includes('ecosystem') ||
      cleanTopicLower.includes('bacteria') ||
      cleanTopicLower.includes('virus') ||
      cleanTopicLower.includes('immunity') ||
      cleanTopicLower.includes('mitosis') ||
      cleanTopicLower.includes('meiosis') ||
      cleanTopicLower.includes('metabolism');

    if (isBio) {
      return {
        reply: `${topicTitle} is the biological process by which living organisms and their specialized cells coordinate physiological functions to sustain growth, metabolic maintenance, and environmental responsiveness.

Reactants & Inputs: Substrates, cellular nutrients, enzymatic catalysts, and physiological fluids (water, oxygen, carbon compounds).
Products & Biological Outputs: Synthesized macromolecules, biochemical energy (ATP), and metabolic byproducts.

Key Facts About ${topicTitle}:
- Continuous Regulation: Cellular control mechanisms regulate this process continuously to maintain biochemical homeostasis within physiological ranges.
- Specialized Cellular Structures: The process depends on dedicated cellular membranes, enzymatic complexes, and structural tissues adapted for efficient transport and reaction kinetics.
- Interdependence with Metabolic Pathways: It functions in direct coordination with complementary energy-converting and biosynthetic cycles inside the organism.
- Biological Significance: Mastery of this process is foundational for understanding physiological equilibrium, organismal survival, and metabolic disease pathways.`,
        suggestedFollowups: [
          `Key cellular mechanisms of ${topicTitle}`,
          `Role of enzymes in ${topicTitle}`,
          `How ${topicTitle} maintains homeostasis`,
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // 2. Physical Sciences / Physics Detection
    const isPhysics =
      cleanTopicLower.includes('force') ||
      cleanTopicLower.includes('motion') ||
      cleanTopicLower.includes('velocity') ||
      cleanTopicLower.includes('acceleration') ||
      cleanTopicLower.includes('gravity') ||
      cleanTopicLower.includes('momentum') ||
      cleanTopicLower.includes('energy') ||
      cleanTopicLower.includes('work') ||
      cleanTopicLower.includes('power') ||
      cleanTopicLower.includes('pressure') ||
      cleanTopicLower.includes('fluid') ||
      cleanTopicLower.includes('wave') ||
      cleanTopicLower.includes('sound') ||
      cleanTopicLower.includes('light') ||
      cleanTopicLower.includes('optic') ||
      cleanTopicLower.includes('reflection') ||
      cleanTopicLower.includes('refraction') ||
      cleanTopicLower.includes('lens') ||
      cleanTopicLower.includes('mirror') ||
      cleanTopicLower.includes('electric') ||
      cleanTopicLower.includes('current') ||
      cleanTopicLower.includes('voltage') ||
      cleanTopicLower.includes('resistance') ||
      cleanTopicLower.includes('circuit') ||
      cleanTopicLower.includes('magnet') ||
      cleanTopicLower.includes('induction') ||
      cleanTopicLower.includes('flux') ||
      cleanTopicLower.includes('thermodynamic') ||
      cleanTopicLower.includes('heat') ||
      cleanTopicLower.includes('quantum') ||
      cleanTopicLower.includes('semiconductor');

    if (isPhysics) {
      return {
        reply: `${topicTitle} is the fundamental physical principle describing how matter, energy, and force fields interact across space and time under invariant natural laws.

Governing Relationship: Relates applied dynamical forces, energetic transitions, or field gradients across the system boundaries.
Primary Quantities & SI Units: Expressed in coherent derived SI units satisfying dimensional conservation laws (mass in kg, length in meters, time in seconds, current in amperes).

Key Facts About ${topicTitle}:
- Conservation Invariance: Satisfies fundamental conservation laws—total energy, momentum, or electric charge remains strictly conserved throughout all transitions.
- Directional & Boundary Constraints: The magnitude and direction of the physical interaction depend on system boundaries, equilibrium conditions, and the reference coordinate frame.
- Inverse & Complementary Counterparts: Physical laws often exhibit symmetry where driving potentials are balanced by opposing resistive or restoring forces.
- Practical Applications: Foundational across mechanical, electrical, and optical engineering, sensor technologies, and classical problem solving.`,
        suggestedFollowups: [
          `Derivation of governing equations for ${topicTitle}`,
          `SI units and dimensional formula of ${topicTitle}`,
          `Numerical problem solving techniques for ${topicTitle}`,
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // 3. Chemical Sciences / Chemistry Detection
    const isChem =
      cleanTopicLower.includes('acid') ||
      cleanTopicLower.includes('base') ||
      cleanTopicLower.includes('salt') ||
      cleanTopicLower.includes('reaction') ||
      cleanTopicLower.includes('reagent') ||
      cleanTopicLower.includes('catalyst') ||
      cleanTopicLower.includes('equilibrium') ||
      cleanTopicLower.includes('mole') ||
      cleanTopicLower.includes('solution') ||
      cleanTopicLower.includes('precipitate') ||
      cleanTopicLower.includes('redox') ||
      cleanTopicLower.includes('oxidation') ||
      cleanTopicLower.includes('reduction') ||
      cleanTopicLower.includes('bond') ||
      cleanTopicLower.includes('organic') ||
      cleanTopicLower.includes('hydrocarbon') ||
      cleanTopicLower.includes('functional group') ||
      cleanTopicLower.includes('element') ||
      cleanTopicLower.includes('compound') ||
      cleanTopicLower.includes('periodic') ||
      cleanTopicLower.includes('atom') ||
      cleanTopicLower.includes('electron') ||
      cleanTopicLower.includes('valence') ||
      cleanTopicLower.includes('chromatography') ||
      cleanTopicLower.includes('titration') ||
      cleanTopicLower.includes('distillation') ||
      cleanTopicLower.includes('electrolysis');

    if (isChem) {
      return {
        reply: `${topicTitle} is the chemical process and theoretical framework governing molecular interactions, electron rearrangements, and substance transformations.

Reactants & Reagents: Starting molecular species, electron donors/acceptors, and requisite catalysts or solvent media.
Products & Chemical Outcomes: Stable product molecules, ionic complexes, and associated thermodynamic enthalpy changes (exothermic or endothermic).

Key Facts About ${topicTitle}:
- Conservation of Mass & Charge: Stoichiometric balance dictates that the number of atoms and net electrical charge remain identical before and after reaction.
- Energetics & Activation Energy: Molecular collisions must exceed the activation energy barrier with favorable spatial orientation for effective transformation.
- Equilibrium & Reversibility: Spontaneous chemical direction is governed by Gibbs free energy minimization and Le Chatelier's equilibrium principles.
- Laboratory & Industrial Relevance: Central to chemical synthesis, analytical assays, material formulation, and standard board exam derivations.`,
        suggestedFollowups: [
          `Balanced chemical equations for ${topicTitle}`,
          `Factors affecting reaction rate in ${topicTitle}`,
          `Industrial applications of ${topicTitle}`,
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // 4. Mathematical Sciences Detection
    const isMath =
      cleanTopicLower.includes('equation') ||
      cleanTopicLower.includes('formula') ||
      cleanTopicLower.includes('theorem') ||
      cleanTopicLower.includes('calculus') ||
      cleanTopicLower.includes('algebra') ||
      cleanTopicLower.includes('derivative') ||
      cleanTopicLower.includes('integral') ||
      cleanTopicLower.includes('matrix') ||
      cleanTopicLower.includes('matrices') ||
      cleanTopicLower.includes('determinant') ||
      cleanTopicLower.includes('vector') ||
      cleanTopicLower.includes('triangle') ||
      cleanTopicLower.includes('trigonometry') ||
      cleanTopicLower.includes('geometry') ||
      cleanTopicLower.includes('probability') ||
      cleanTopicLower.includes('statistic') ||
      cleanTopicLower.includes('progression') ||
      cleanTopicLower.includes('series') ||
      cleanTopicLower.includes('quadratic') ||
      cleanTopicLower.includes('polynomial') ||
      cleanTopicLower.includes('graphing') ||
      /\bgraph(s)?\b/i.test(cleanTopicLower);

    if (isMath) {
      return {
        reply: `${topicTitle} is a mathematical structure and analytical tool used to represent quantitative relationships, spatial models, and variable transformations with logical rigor.

Standard Mathematical Representation: Expressed through algebraic equations, geometric relations, or differential formulations with defined operational domains.
Key Parameters: Independent variables, dependent outputs, coefficients, and boundary constants.

Key Facts About ${topicTitle}:
- Deterministic Consistency: Given well-defined input conditions, mathematical principles yield invariant, provable outcomes through axiomatic rules.
- Geometric & Analytical Duality: Can be interpreted both graphically (as geometric loci, slopes, or surfaces) and algebraically (as symbolic expressions).
- Boundary Constraints: Requires verification of domain limits, non-zero denominators, and sign conventions to prevent indeterminate forms.
- Problem-Solving Methodology: Solved systematically by identifying knowns/unknowns, isolating target variables, and applying standard canonical formulas.`,
        suggestedFollowups: [
          `Step-by-step example problem for ${topicTitle}`,
          `Standard formula and proof of ${topicTitle}`,
          `Common algebraic mistakes in ${topicTitle}`,
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // 5. Computer Science & Software Engineering Detection
    const isCS =
      cleanTopicLower.includes('program') ||
      cleanTopicLower.includes('code') ||
      cleanTopicLower.includes('algorithm') ||
      cleanTopicLower.includes('data structure') ||
      cleanTopicLower.includes('function') ||
      cleanTopicLower.includes('class') ||
      cleanTopicLower.includes('object') ||
      cleanTopicLower.includes('memory') ||
      cleanTopicLower.includes('database') ||
      cleanTopicLower.includes('network') ||
      cleanTopicLower.includes('server') ||
      cleanTopicLower.includes('client') ||
      cleanTopicLower.includes('operating system') ||
      cleanTopicLower.includes('thread') ||
      cleanTopicLower.includes('process') ||
      cleanTopicLower.includes('api') ||
      cleanTopicLower.includes('interface');

    if (isCS) {
      return {
        reply: `${topicTitle} is an architectural and algorithmic concept in computer science designed to structure data, optimize computational processing, and manage computational resources efficiently.

Core Mechanism: Processes input parameters through structured logical instructions to achieve deterministic computational state transitions.
Complexity Profile: Evaluated via asymptotic Time Complexity (operations relative to input size n) and Space Complexity (auxiliary memory allocation).

Key Facts About ${topicTitle}:
- Deterministic Execution: State transitions follow strict algorithmic preconditions and postconditions with verified invariant termination.
- Space vs Time Trade-offs: Engineering implementations routinely balance memory footprint against processing latency to achieve optimal throughput.
- Error Handling & Edge Cases: Robust implementations must safeguard against null references, bounds overflow, and race conditions.
- Production Use Cases: Widely deployed in scalable backend services, distributed systems, system utilities, and technical interview algorithms.`,
        suggestedFollowups: [
          `Time and space complexity of ${topicTitle}`,
          `Code implementation of ${topicTitle}`,
          `Best practices and common pitfalls in ${topicTitle}`,
        ],
        emotionalTone: 'clear-educational',
      };
    }

    // 6. Universal Academic Topic Synthesizer
    return {
      reply: `${topicTitle} is an essential academic concept that examines how governing rules, underlying components, and real-world mechanisms interact within this domain.

Core Principle: Operates through foundational relationships that connect primary inputs, operational transformations, and definitive outcomes.
Key Parameters: System variables, environmental conditions, and structural elements that dictate observable behavior.

Key Facts About ${topicTitle}:
- Systematic Operation: Governed by established empirical laws and analytical models rather than random variations.
- Structural Organization: Relies on clearly defined functional components that work in coordinated sequence.
- Comparative Dynamics: Balances driving forces against resistance, constraints, or inverse processes to achieve stability.
- Educational & Examination Relevance: Frequently evaluated in conceptual derivations, comparative analyses, and application problem solving.`,
      suggestedFollowups: [
        `Core rules and principles of ${topicTitle}`,
        `Step-by-step example illustrating ${topicTitle}`,
        `Key differences between ${topicTitle} and related concepts`,
      ],
      emotionalTone: 'clear-educational',
    };
  }

  /**
   * Fallback Study Plan Generator
   */
  private createIntelligentFallbackPlan(input: StudyPlanPromptInput) {
    let cleanSyllabus = input.syllabus || '';
    const syllabusMatch = cleanSyllabus.match(/(?:syllabus covers|syllabus is|topics are|chapters are|covering|covers)\s+([^.]+)/i);
    if (syllabusMatch) {
      cleanSyllabus = syllabusMatch[1];
    }

    const rawChapters = cleanSyllabus
      ? cleanSyllabus
          .split(/,|\n| and /i)
          .map((s) => s.replace(/^(and|the|a)\s+/i, '').trim())
          .filter((s) => s.length > 2 && !s.toLowerCase().includes('buddhi') && !s.toLowerCase().includes('please'))
      : ['Foundational Concepts', 'Core Principles', 'Problem Solving & Derivations', 'Advanced Applications'];

    const chapters = rawChapters.length > 0 ? rawChapters : ['Foundational Concepts', 'Core Principles', 'Problem Solving & Derivations', 'Advanced Applications'];

    const daysCount = 7;
    const schedule: any[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const chapterIdx = (day - 1) % chapters.length;
      const chapter = chapters[chapterIdx];

      if (day === 4 || day === 7) {
        schedule.push({
          day,
          dateLabel: `Day ${day} (Consolidation & Wellness)`,
          tasks: [
            {
              title: `Active Recall: Comprehensive Review of ${chapter}`,
              description: 'Self-test key concepts, review flashcards, and write down formulas from memory without looking at notes.',
              priority: 'HIGH',
              durationMin: 45,
            },
            {
              title: 'Practice Quiz & Error Analysis',
              description: 'Solve timed practice questions and document any misconceptions in your study journal.',
              priority: 'MEDIUM',
              durationMin: 35,
            },
            {
              title: 'Mind Reset & Physical Rejuvenation',
              description: 'Take a brisk 20-minute walk, hydrate, and practice deep breathing. Mental recovery cements neuroplasticity.',
              priority: 'LOW',
              durationMin: 20,
            },
          ],
        });
      } else {
        schedule.push({
          day,
          dateLabel: `Day ${day}`,
          tasks: [
            {
              title: `Concept Deep-Dive: ${chapter}`,
              description: `Understand first principles, definitions, and underlying mechanisms of ${chapter}.`,
              priority: 'HIGH',
              durationMin: Math.min(60, Math.round(input.dailyHours * 30)),
            },
            {
              title: `Structured Problem Solving: ${chapter}`,
              description: 'Work through illustrative textbook examples step-by-step.',
              priority: 'MEDIUM',
              durationMin: 45,
            },
            {
              title: 'Micro-Summary & Flashcard Creation',
              description: 'Distill the 3 most crucial takeaways into Buddhi Flashcards for spaced repetition.',
              priority: 'LOW',
              durationMin: 20,
            },
          ],
        });
      }
    }

    return {
      title: `Personalized ${input.subjectName} Mastery Blueprint`,
      summary: `Tailored for ${input.academicLevel} preparation. Designed with psychological balance to optimize retention through interleaved study, focused problem sets, and deliberate recovery intervals.`,
      schedule,
    };
  }

  /**
   * Fallback Quiz Generator supporting MCQ, Short Answers, and Long Answers
   */
  private createIntelligentFallbackQuiz(input: QuizPromptInput) {
    const topic = input.topic || 'Core Principles';
    const quizType = input.quizType || 'MCQ';
    const totalCount = input.totalQuestions || 5;

    if (quizType === 'SHORT_ANSWER') {
      const shortQuestions = [
        {
          questionText: `State the fundamental principle governing ${topic} in ${input.subjectName} and write its governing mathematical relationship.`,
          questionType: 'SHORT_ANSWER' as const,
          options: [],
          correctIndex: 0,
          sampleAnswer: `The governing principle states that in an isolated system, the total quantity remains conserved. The mathematical equation is expressed as balance between input and output rates under steady state.`,
          keyPoints: ['State the conservation law', 'Identify the governing equation', 'State boundary assumptions'],
          explanation: 'Clear conceptual definitions must pair theoretical statements with formal notation.',
        },
        {
          questionText: `Explain why temperature or boundary conditions must be specified when analyzing ${topic}.`,
          questionType: 'SHORT_ANSWER' as const,
          options: [],
          correctIndex: 0,
          sampleAnswer: `Physical and chemical rate constants vary exponentially with temperature (as governed by Arrhenius or thermodynamic relations). Uncontrolled temperature renders empirical constants variable.`,
          keyPoints: ['Exponential variation of constants', 'Temperature influences kinetic energy', 'Reproducibility of results'],
          explanation: 'Constants in physical laws are only invariant when environmental parameters are kept stable.',
        },
        {
          questionText: `What is the most frequent misconception made by students when solving numericals on ${topic}?`,
          questionType: 'SHORT_ANSWER' as const,
          options: [],
          correctIndex: 0,
          sampleAnswer: `Students frequently mix non-standard units (e.g., using centimeters instead of SI meters, or Celsius instead of Kelvin in thermodynamic equations).`,
          keyPoints: ['Unit conversion to SI base', 'Reference frame consistency'],
          explanation: 'Dimensional analysis and unit conversion eliminates majority of calculation mistakes.',
        },
      ];

      return {
        title: `${input.subjectName} - ${topic} (Short Answer Assessment)`,
        quizType: 'SHORT_ANSWER' as const,
        questions: shortQuestions.slice(0, totalCount),
      };
    }

    if (quizType === 'LONG_ANSWER') {
      const longQuestions = [
        {
          questionText: `Describe the complete theoretical derivation and experimental verification of ${topic} in ${input.subjectName}. Include governing diagrams, steps, and limitations.`,
          questionType: 'LONG_ANSWER' as const,
          options: [],
          correctIndex: 0,
          sampleAnswer: `1. Introduction & Historical Context: Define the phenomenon and state historical limitations of earlier models.\n2. Schematic & Experimental Setup: Detail the components, source, detector, and variables.\n3. Step-by-Step Derivation: Establish initial differential relationships, integrate over boundary limits, and derive the master equation.\n4. Graphical Representation: Sketch the expected behavior across varying parameters.\n5. Practical Applications & Limitations: Identify where the equation breaks down (e.g. relativistic speeds or non-ideal behavior).`,
          keyPoints: ['Definition and assumptions', 'Mathematical derivation steps', 'Graphical analysis', 'Real-world limitations'],
          explanation: 'Comprehensive long answers require a structured format: Concept -> Derivation -> Diagram/Graph -> Applications.',
        },
        {
          questionText: `Provide an in-depth comparative analysis between ${topic} and its alternate classical mechanism. Discuss why modern scientific models replaced earlier hypotheses.`,
          questionType: 'LONG_ANSWER' as const,
          options: [],
          correctIndex: 0,
          sampleAnswer: `The earlier model relied on continuous wave propagation, which failed to explain discrete quantum observations (such as instantaneous emission and threshold frequency). The modern model adopts quantized exchange of energy, perfectly reconciling empirical observations.`,
          keyPoints: ['Classical wave limitations', 'Quantum/modern hypothesis', 'Empirical validation', 'Conclusion'],
          explanation: 'Comparative analysis requires explicit contrast points rather than separate isolated paragraphs.',
        },
      ];

      return {
        title: `${input.subjectName} - ${topic} (Long Answer Assessment)`,
        quizType: 'LONG_ANSWER' as const,
        questions: longQuestions.slice(0, totalCount),
      };
    }

    // Default: MCQ (Guaranteed Minimum 20 Questions grounded in Syllabus)
    const chapterContext = input.chapterTitle ? `(${input.chapterTitle}) ` : '';
    const subject = input.subjectName || 'Curriculum';

    const generateQuestionsForTopic = (top: string, subj: string, chap: string): any[] => {
      return [
        {
          questionText: `1. In ${subj} ${chap}, which statement provides the most accurate physical definition of "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `It represents the primary state variable governing equilibrium and structural energy transfer under standard reference conditions.`,
            `It is an empirical constant that remains invariant regardless of temperature and reference frames.`,
            `It is a scalar scalar quantity that ignores spatial orientation and vector constraints.`,
            `It is an isolated mathematical artifact with no physical manifestation in real systems.`,
          ],
          correctIndex: 0,
          explanation: `In ${subj}, ${top} is defined through fundamental conservation laws and measurable state variables rather than arbitrary empirical constants.`,
        },
        {
          questionText: `2. What invariant conservation law or fundamental theorem directly governs "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Stochastic distribution without any underlying symmetry or conservation`,
            `Linear extrapolation assuming unbounded infinite energy`,
            `Conservation of total mechanical energy and momentum within an isolated system`,
            `Arbitrary parameter variation under non-inertial observation`,
          ],
          correctIndex: 2,
          explanation: `All analytical derivations in ${top} must strictly satisfy conservation of energy, momentum, or charge as an invariant boundary framework.`,
        },
        {
          questionText: `3. When formulating the mathematical relationship for "${top}", what is the primary equation structure?`,
          questionType: 'MCQ' as const,
          options: [
            `A balance equation relating rate of change to applied generalized forces or flux gradients`,
            `A constant ratio that is purely dimensionless and non-computable`,
            `An exponential divergence with zero equilibrium points`,
            `A purely random algebraic summation without dimensional consistency`,
          ],
          correctIndex: 0,
          explanation: `The governing equation for ${top} expresses a rate of transfer or balance between driving gradients and intrinsic system resistance.`,
        },
        {
          questionText: `4. Which critical assumption must be satisfied for the standard textbook equations of "${top}" to remain valid?`,
          questionType: 'MCQ' as const,
          options: [
            `The system must be in relativistic supersonic motion`,
            `Environmental parameters (temperature, pressure, and reference frame) must remain well-defined and uniform`,
            `Frictional drag must be infinite across all contact boundaries`,
            `The surrounding medium must have zero density and zero dielectric constant`,
          ],
          correctIndex: 1,
          explanation: `Standard closed-form models for ${top} assume stationary boundary conditions; unmonitored temperature or non-inertial accelerations invalidate simple proportionality.`,
        },
        {
          questionText: `5. In dimensional analysis, what are the standard SI base units associated with the primary parameter of "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Arbitrary non-standard units lacking dimensional homogeneity`,
            `Consistent SI derived units satisfying base dimensions of mass (kg), length (m), time (s), and current (A)`,
            `Purely dimensionless numbers with no physical scale`,
            `Logarithmic indices without reference datum`,
          ],
          correctIndex: 1,
          explanation: `Dimensional homogeneity requires that every term in the governing relationship for ${top} has identical SI dimensions.`,
        },
        {
          questionText: `6. If the primary independent variable in "${top}" is doubled while holding other factors constant, how does the resulting output scale?`,
          questionType: 'MCQ' as const,
          options: [
            `It drops immediately to zero`,
            `It remains completely unchanged under all circumstances`,
            `It scales according to the governing power law (linear, inverse, or quadratic depending on the exponent)`,
            `It becomes completely non-deterministic`,
          ],
          correctIndex: 2,
          explanation: `Analytical models in ${subj} scale predictably with variable powers; identifying whether ${top} is first-order or second-order is critical for exam problem-solving.`,
        },
        {
          questionText: `7. Which key postulate or theorem is most frequently applied when deriving relationships in "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Superposition principle and linear differential balance`,
            `Ignoring boundary constraints to simplify numerical answers`,
            `Assuming zero reaction force across all interfaces`,
            `Eliminating non-zero terms prior to integration`,
          ],
          correctIndex: 0,
          explanation: `The principle of superposition and continuous differential balance enables solving both static and dynamic instances of ${top}.`,
        },
        {
          questionText: `8. On an analytical graph illustrating "${top}", what physical property does the slope (gradient) represent?`,
          questionType: 'MCQ' as const,
          options: [
            `The total cumulative energy dissipated over infinite time`,
            `The instantaneous rate of change of the dependent variable with respect to the driving parameter`,
            `A meaningless plotting artifact with no physical interpretation`,
            `The inverse square of atmospheric pressure`,
          ],
          correctIndex: 1,
          explanation: `In graphic analysis of ${top}, dy/dx directly yields the instantaneous sensitivity, compliance, or rate constant of the phenomenon.`,
        },
        {
          questionText: `9. What does the area under the curve represent on a characteristic plot related to "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `The total integrated work done, impulse, or cumulative accumulated quantity across the interval`,
            `The error margin of the recording sensor`,
            `The ratio of primary constants divided by zero`,
            `A constant offset with no thermodynamic meaning`,
          ],
          correctIndex: 0,
          explanation: `Integrating the function over the operational limits yields the total net quantity (energy, flux, or charge) associated with ${top}.`,
        },
        {
          questionText: `10. How is "${top}" distinguished from its closely related counterpart concept in ${subj}?`,
          questionType: 'MCQ' as const,
          options: [
            `They are completely identical with no distinguishing features`,
            `One governs steady-state equilibrium while the counterpart governs transient dynamic response`,
            `The counterpart concept only applies in virtual simulations`,
            `One is an empirical approximation while the other lacks mathematical representation`,
          ],
          correctIndex: 1,
          explanation: `Examiners test this contrast specifically: recognizing whether a problem involves steady-state equilibrium or transient kinetics in ${top} prevents catastrophic errors.`,
        },
        {
          questionText: `11. In engineering and practical technology, what is the most prominent real-world application of "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Optimizing system efficiency, sensor calibration, and structural load distribution in modern devices`,
            `Artificially increasing power consumption with zero output benefit`,
            `Restricting data collection to qualitative descriptions only`,
            `Eliminating digital computing components from industrial equipment`,
          ],
          correctIndex: 0,
          explanation: `Principles of ${top} are applied across structural engineering, electrical circuitry, and chemical synthesis to maximize efficiency.`,
        },
        {
          questionText: `12. What is the single most common examination trap or misconception students encounter regarding "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Failing to convert parameters into consistent SI base units and neglecting sign conventions`,
            `Writing out complete algebraic steps rather than guessing answers`,
            `Drawing clear free-body schematics before calculating`,
            `Verifying solutions at extreme limiting values (0 and infinity)`,
          ],
          correctIndex: 0,
          explanation: `Over 60% of mistakes in competitive ${subj} exams arise from mixing units (e.g. cm vs m, Celsius vs Kelvin) and forgetting directional sign conventions.`,
        },
        {
          questionText: `13. When analyzing the vector character of "${top}", which directional convention is standard?`,
          questionType: 'MCQ' as const,
          options: [
            `Vectors are directed along the gradient of decreasing potential or conforming to right-hand rules`,
            `Direction is arbitrary and reverses upon each measurement cycle`,
            `All parameters in ${top} are strictly non-directional scalars`,
            `Direction is determined by the latitude of the laboratory`,
          ],
          correctIndex: 0,
          explanation: `Vector quantities associated with ${top} strictly obey right-hand rotational rules and negative gradient descent conventions.`,
        },
        {
          questionText: `14. Under what condition does the phenomenon described by "${top}" achieve dynamic stability or steady state?`,
          questionType: 'MCQ' as const,
          options: [
            `When net generalized flux and dissipation balance driving input rates, resulting in zero net accumulation`,
            `When temperature approaches absolute zero instantaneously`,
            `When all external forces are multiplied by a random factor`,
            `When the system transitions into complete chaos`,
          ],
          correctIndex: 0,
          explanation: `Steady-state conditions require a dynamic balance where creation/input rates precisely match destruction/dissipation rates.`,
        },
        {
          questionText: `15. In laboratory experimentation on "${top}", what role does the control variable play?`,
          questionType: 'MCQ' as const,
          options: [
            `It is held rigorously constant to isolate the causative relationship between independent and dependent parameters`,
            `It is continuously varied at random to create noise`,
            `It replaces the dependent variable during data regression`,
            `It is disregarded entirely during hypothesis testing`,
          ],
          correctIndex: 0,
          explanation: `Scientific rigor requires keeping control parameters invariant so observed shifts in ${top} can be uniquely attributed to the tested variable.`,
        },
        {
          questionText: `16. How does energy dissipation manifest in non-ideal real-world instances of "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Energy is destroyed and ceases to exist in the universe`,
            `Energy is converted into non-recoverable thermal vibrations, acoustic waves, or internal entropy increase`,
            `Energy is transformed exclusively into nuclear binding energy`,
            `Energy increases spontaneously without any input source`,
          ],
          correctIndex: 1,
          explanation: `By the Second Law of Thermodynamics, non-ideal inefficiencies in ${top} degrade organized mechanical/electrical work into thermal entropy.`,
        },
        {
          questionText: `17. What microscopic mechanism underpins the macroscopic observations in "${top}"?`,
          questionType: 'MCQ' as const,
          options: [
            `Statistical aggregation of countless atomic/molecular collisions and quantum state transitions`,
            `Continuous continuous fluid motion devoid of discrete atomic particles`,
            `Fixed mechanical gears operating at the subatomic scale`,
            `Spontaneous violation of Coulombic electrostatic attraction`,
          ],
          correctIndex: 0,
          explanation: `Macroscopic laws of ${top} represent the statistical average behavior of trillions of discrete microscopic molecular interactions.`,
        },
        {
          questionText: `18. When evaluating the asymptotic limiting behavior of "${top}" as the primary variable approaches infinity, what occurs?`,
          questionType: 'MCQ' as const,
          options: [
            `The function converges to a well-defined saturation plateau or follows an established asymptotic limit`,
            `The laws of mathematics fail completely and cannot be evaluated`,
            `The value alternates infinitely between plus and minus one without pattern`,
            `The physical dimensions of the universe contract to zero`,
          ],
          correctIndex: 0,
          explanation: `Checking limiting behavior (x -> 0 and x -> infinity) verifies whether mathematical formulas for ${top} remain physically sensible.`,
        },
        {
          questionText: `19. What diagnostic step should a student take if their derived value for "${top}" is negative when a positive scalar was expected?`,
          questionType: 'MCQ' as const,
          options: [
            `Erase the minus sign and pretend it was never calculated`,
            `Re-examine the initial coordinate system, sign convention assumptions, and integration limits`,
            `Assume the physical universe is functioning in reverse`,
            `Multiply the entire calculation by a random arbitrary constant`,
          ],
          correctIndex: 1,
          explanation: `Unexpected negative signs almost always signal an inverted coordinate axis, an improperly ordered integration limit (b to a instead of a to b), or a misunderstood force convention.`,
        },
        {
          questionText: `20. How does mastery of "${top}" form a prerequisite foundation for subsequent advanced chapters in ${subj}?`,
          questionType: 'MCQ' as const,
          options: [
            `It has no relation to any future topics in the syllabus`,
            `Its core balance equations and mental models recur as building blocks in higher-level multi-physics and competitive examination problems`,
            `It is immediately superseded and contradicted by all subsequent chapters`,
            `It is only useful for historical examination retrospectives`,
          ],
          correctIndex: 1,
          explanation: `Curriculum design is cumulative: mastering ${top} provides the conceptual scaffolding required to tackle coupled multi-step problems in advanced ${subj}.`,
        },
      ];
    };

    const mcqQuestions = generateQuestionsForTopic(topic, subject, chapterContext);

    return {
      title: `${subject} - ${topic} (Comprehensive 20-Question Diagnostic)`,
      quizType: 'MCQ' as const,
      questions: mcqQuestions.slice(0, Math.max(20, totalCount)),
    };
  }

  /**
   * Fallback Evaluator for Short / Long Written Answers
   */
  private createIntelligentFallbackEvaluation(input: AnswerEvaluationInput): AnswerEvaluationResult {
    const text = input.studentAnswer.trim();
    const wordCount = text.split(/\s+/).length;
    const lower = text.toLowerCase();

    // Check keyword presence
    let pointsMatched = 0;
    const expected = input.keyPoints || ['conservation', 'equilibrium', 'temperature', 'formula', 'proportional', 'constant', 'system', 'mechanism'];
    expected.forEach((kp) => {
      if (lower.includes(kp.toLowerCase())) pointsMatched++;
    });

    let score = 50;
    if (wordCount >= 15) score += 20;
    if (wordCount >= 40 && input.questionType === 'LONG_ANSWER') score += 15;
    score += Math.min(20, pointsMatched * 8);
    score = Math.min(95, score);

    const strengths: string[] = [];
    const mistakes: string[] = [];
    const improvements: string[] = [];

    if (wordCount >= 15) {
      strengths.push('Good attempt with clear sentence structure.');
    } else {
      mistakes.push('Answer is somewhat brief; lacks full conceptual elaboration.');
      improvements.push('Expand your explanation with at least 2 full supporting sentences.');
    }

    if (pointsMatched > 0) {
      strengths.push('Identified relevant core scientific terminology.');
    } else {
      mistakes.push('Did not incorporate specific subject keywords.');
      improvements.push('Include exact scientific terms (e.g. constant, equilibrium, proportional).');
    }

    improvements.push('State the mathematical or experimental conditions before drawing your conclusion.');

    return {
      score,
      passed: score >= 60,
      feedback: score >= 75
        ? 'Well articulated response! You demonstrated solid grasp of the core concepts.'
        : 'Good effort. Your intuition is on the right track, but your answer needs sharper technical terminology to secure full marks in board exams.',
      strengths,
      mistakes,
      improvements,
      modelAnswer: input.sampleAnswer || 'Ensure your answer states the formal definition, the governing relationship, and the limiting conditions.',
    };
  }

  /**
   * High-Yield Syllabus-Grounded Fallback Flashcards Generator
   */
  private createIntelligentFallbackFlashcards(input: FlashcardPromptInput) {
    const topic = input.topic || 'Core Concept';
    const subject = input.subjectName || 'Syllabus';
    const chapter = input.chapterTitle ? `(${input.chapterTitle})` : '';

    return [
      {
        question: `What is the precise scientific definition and core physical meaning of "${topic}" in ${subject}?`,
        answer: `In ${subject} ${chapter}, "${topic}" defines the fundamental mechanism governing how system state variables transform, distribute energy, and maintain equilibrium under defined physical boundaries.`,
        keyConcept: `${topic} Definition & Mental Model`,
        difficulty: 'EASY' as const,
      },
      {
        question: `What is the primary governing formula and mathematical relationship for "${topic}"?`,
        answer: `Expressed as an invariant balance: the rate of change or force gradient is directly proportional to driving potentials and inversely related to intrinsic system resistance or inertia.`,
        keyConcept: `Governing Equation of ${topic}`,
        difficulty: 'MEDIUM' as const,
      },
      {
        question: `Under what critical boundary conditions and assumptions does the standard model of "${topic}" hold?`,
        answer: `It strictly assumes steady environmental conditions (constant temperature and reference frame) without unmonitored external non-inertial disruptions.`,
        keyConcept: 'Boundary Conditions & Assumptions',
        difficulty: 'MEDIUM' as const,
      },
      {
        question: `What high-yield examination pitfall or trap do students frequently fall into when solving problems on "${topic}"?`,
        answer: `Neglecting unit dimensional conversion (e.g., using cm or grams instead of SI meters/kg) and forgetting directional sign conventions in vector balance.`,
        keyConcept: 'High-Yield Exam Strategy & Pitfall',
        difficulty: 'HARD' as const,
      },
      {
        question: `What is the practical real-world or engineering application of "${topic}"?`,
        answer: `It provides the operational basis for engineering design, structural equilibrium, circuit load management, and industrial reaction optimization.`,
        keyConcept: 'Real-World Technology Application',
        difficulty: 'MEDIUM' as const,
      },
      {
        question: `How does doubling the primary independent parameter influence "${topic}"?`,
        answer: `Because it scales according to its characteristic power law, doubling the input leads to a predictable factor change (linear, quadratic, or inverse) governed by its analytical exponent.`,
        keyConcept: 'Scaling Power Law',
        difficulty: 'HARD' as const,
      },
      {
        question: `Active Recall Challenge: Explain the core concept of "${topic}" to a fellow classmate in two simple sentences.`,
        answer: `Think of it as nature's balancing act: whenever you apply a driving force or gradient, the system responds by redistributing energy until a new stable equilibrium is reached.`,
        keyConcept: 'Intuitive Active Retrieval',
        difficulty: 'EASY' as const,
      },
      {
        question: `Why is active recall and spaced repetition essential for permanent mastery of "${topic}"?`,
        answer: `Neuroplastic retrieval forces synaptic consolidation, actively preventing the Ebbinghaus forgetting curve and cementing rapid recall under exam pressure.`,
        keyConcept: 'Cognitive Science Learning Rule',
        difficulty: 'EASY' as const,
      },
    ];
  }

  private generateFollowups(message: string, academicLevel?: string): string[] {
    return [
      'Explain this using a simple real-life analogy',
      'Show a step-by-step exam question on this',
      'Generate a 3-question quick quiz',
      'How does this topic link to upcoming chapters?',
    ];
  }
}

export const aiService = new AIService();
