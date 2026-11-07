import {
  User,
  Subject,
  StudyTask,
  StudyPlan,
  Note,
  Flashcard,
  Quiz,
  AnalyticsData,
  AgentAction,
} from '../types/index.js';

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('buddhi_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }

    return data as T;
  }

  // ==========================================
  // Auth & Profile
  // ==========================================
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
    academicLevel?: string
  ): Promise<{ token: string; user: User }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, academicLevel }),
    });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  async updateProfile(profileData: Partial<User['profile']> & { name?: string }): Promise<any> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // ==========================================
  // Subjects & Topics
  // ==========================================
  async autoPopulateCurriculum(data: {
    gradeClass: string;
    board?: string;
    stream?: string;
    targetExams?: string;
  }): Promise<{ message: string; subjectsCount: number; flashcardsCount: number }> {
    return this.request('/subjects/auto-populate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubjects(): Promise<{ subjects: Subject[] }> {
    return this.request('/subjects');
  }

  async getSubjectById(id: string): Promise<{ subject: Subject }> {
    return this.request(`/subjects/${id}`);
  }

  async createSubject(data: Partial<Subject>): Promise<{ subject: Subject }> {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubject(id: string, data: Partial<Subject>): Promise<{ subject: Subject }> {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: string): Promise<{ message: string }> {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  async createChapter(subjectId: string, title: string, orderIndex?: number): Promise<any> {
    return this.request('/subjects/chapters', {
      method: 'POST',
      body: JSON.stringify({ subjectId, title, orderIndex }),
    });
  }

  async createTopic(chapterId: string, title: string, difficulty?: string, orderIndex?: number): Promise<any> {
    return this.request('/subjects/topics', {
      method: 'POST',
      body: JSON.stringify({ chapterId, title, difficulty, orderIndex }),
    });
  }

  async updateTopic(id: string, data: { status?: string; difficulty?: string; title?: string }): Promise<any> {
    return this.request(`/subjects/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTopic(id: string): Promise<any> {
    return this.request(`/subjects/topics/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Planner & Tasks
  // ==========================================
  async generateStudyPlan(params: {
    subjectName: string;
    subjectId?: string;
    syllabus: string;
    examDate?: string;
    dailyHours?: number;
    prepLevel?: string;
    priorityTopics?: string;
  }): Promise<{ draft: any; subjectId: string | null }> {
    return this.request('/planner/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async saveApprovedPlan(planData: {
    title: string;
    summary: string;
    schedule: any[];
    subjectId?: string;
    targetExamDate?: string;
    dailyHours?: number;
    prepLevel?: string;
  }): Promise<{ plan: StudyPlan; createdTasksCount: number }> {
    return this.request('/planner/save', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getPlans(): Promise<{ plans: StudyPlan[] }> {
    return this.request('/planner/plans');
  }

  async getTasks(params?: { status?: string; filter?: string }): Promise<{ tasks: StudyTask[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/planner/tasks${query ? `?${query}` : ''}`);
  }

  async createTask(task: Partial<StudyTask>): Promise<{ task: StudyTask }> {
    return this.request('/planner/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<StudyTask>): Promise<{ task: StudyTask }> {
    return this.request(`/planner/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request(`/planner/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // AI Assistant
  // ==========================================
  async chatWithAssistant(
    message: string,
    conversationId?: string
  ): Promise<{
    conversationId: string;
    message: { role: string; content: string; emotionalTone?: string };
    suggestedFollowups: string[];
    emotionalTone: string;
  }> {
    return this.request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationId }),
    });
  }

  async getAssistantHistory(): Promise<{ conversations: any[] }> {
    return this.request('/assistant/history');
  }

  async clearAssistantConversation(id: string): Promise<{ message: string }> {
    return this.request(`/assistant/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Notes
  // ==========================================
  async getNotes(params?: { subjectId?: string; search?: string }): Promise<{ notes: Note[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/notes${query ? `?${query}` : ''}`);
  }

  async getNoteById(id: string): Promise<{ note: Note }> {
    return this.request(`/notes/${id}`);
  }

  async createNote(note: Partial<Note>): Promise<{ note: Note }> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  }

  async updateNote(id: string, note: Partial<Note>): Promise<{ note: Note }> {
    return this.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
  }

  async deleteNote(id: string): Promise<{ message: string }> {
    return this.request(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async summarizeNote(id: string): Promise<{ summary: string }> {
    return this.request(`/notes/${id}/summarize`, {
      method: 'POST',
    });
  }

  async generateFlashcardsFromNote(id: string): Promise<{ count: number; message: string }> {
    return this.request(`/notes/${id}/flashcards`, {
      method: 'POST',
    });
  }

  // ==========================================
  // Flashcards
  // ==========================================
  async getFlashcards(params?: {
    subjectId?: string;
    chapterTitle?: string;
    topicTitle?: string;
    deckTitle?: string;
  }): Promise<{
    flashcards: Flashcard[];
    decks: Array<{
      title: string;
      subjectId?: string | null;
      subjectName?: string;
      subjectColor?: string;
      chapterTitle?: string | null;
      topicTitle?: string | null;
      cardCount: number;
      masteredCount: number;
      learningCount: number;
      needsReviewCount: number;
    }>;
    subjects: Subject[];
  }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/flashcards${query ? `?${query}` : ''}`);
  }

  async generateAIFlashcards(data: {
    subjectId?: string;
    subjectName?: string;
    chapterTitle?: string;
    topic: string;
    count?: number;
    content?: string;
  }): Promise<{ count: number; deckTitle: string; cards: Flashcard[]; message: string }> {
    return this.request('/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createFlashcard(data: Partial<Flashcard>): Promise<{ card: Flashcard; message: string }> {
    return this.request('/flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFlashcard(id: string, data: Partial<Flashcard>): Promise<{ card: Flashcard; message: string }> {
    return this.request(`/flashcards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateFlashcardMastery(id: string, masteryStatus: string): Promise<{ card: Flashcard }> {
    return this.request(`/flashcards/${id}/mastery`, {
      method: 'PUT',
      body: JSON.stringify({ masteryStatus }),
    });
  }

  async deleteFlashcard(id: string): Promise<{ message: string }> {
    return this.request(`/flashcards/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Quizzes
  // ==========================================
  async getQuizzes(): Promise<{ quizzes: Quiz[] }> {
    return this.request('/quizzes');
  }

  async getQuizById(id: string): Promise<{ quiz: Quiz }> {
    return this.request(`/quizzes/${id}`);
  }

  async generateQuiz(data: {
    subjectId?: string;
    subjectName?: string;
    chapterTitle?: string;
    topic: string;
    difficulty?: string;
    totalQuestions?: number;
    quizType?: string;
  }): Promise<{ quizId: string; title: string; quizType?: string; totalQuestions: number; quiz?: Quiz }> {
    return this.request('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitQuiz(quizId: string, userAnswers: (number | string)[], timeSpentSeconds?: number): Promise<any> {
    return this.request('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify({ quizId, userAnswers, timeSpentSeconds }),
    });
  }

  async evaluateAnswer(data: {
    questionText: string;
    studentAnswer: string;
    sampleAnswer?: string;
    keyPoints?: string[];
    questionType?: string;
  }): Promise<any> {
    return this.request('/quizzes/evaluate-answer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuizHistory(): Promise<{ attempts: any[] }> {
    return this.request('/quizzes/history');
  }

  // ==========================================
  // Timer & Sessions
  // ==========================================
  async logFocusSession(data: {
    durationMinutes: number;
    sessionType?: string;
    subjectId?: string;
    notes?: string;
  }): Promise<{ session: any }> {
    return this.request('/timer/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessionHistory(): Promise<{ sessions: any[] }> {
    return this.request('/timer/sessions');
  }

  // ==========================================
  // Analytics
  // ==========================================
  async getAnalytics(): Promise<AnalyticsData> {
    return this.request('/analytics');
  }

  // ==========================================
  // Switch Integration
  // ==========================================
  async getSwitchStatus(): Promise<any> {
    return this.request('/switch/status');
  }

  async getSwitchActions(): Promise<{ actions: AgentAction[] }> {
    return this.request('/switch/actions');
  }

  async simulateSwitchChat(text: string, channelName?: string): Promise<any> {
    return this.request('/switch/simulate-chat', {
      method: 'POST',
      body: JSON.stringify({ text, channelName }),
    });
  }

  async approveSwitchAction(actionId: string): Promise<any> {
    return this.request('/switch/approve-action', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    });
  }

  async getSwitchRooms(): Promise<{ rooms: any[] }> {
    return this.request('/switch/rooms');
  }

  async createSwitchRoom(data: { name: string; telegramChatId?: string; isShared?: boolean }): Promise<{ room: any }> {
    return this.request('/switch/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addSwitchTeammate(
    roomId: string,
    data: { name: string; handle?: string; role?: string }
  ): Promise<{ teammate: any; message: string }> {
    return this.request(`/switch/rooms/${roomId}/teammates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSwitchTeammate(teammateId: string): Promise<{ message: string }> {
    return this.request(`/switch/teammates/${teammateId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
