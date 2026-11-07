export type AcademicLevel =
  | 'SCHOOL_SECONDARY'
  | 'SENIOR_SECONDARY_PREP'
  | 'UNDERGRADUATE_DEGREE'
  | 'POSTGRADUATE';

export interface UserProfile {
  id: string;
  userId: string;
  academicLevel: AcademicLevel;
  gradeClass?: string; // "Class 1", "Class 10", "Class 12"
  board?: string; // "CBSE", "ICSE", "State Board"
  stream?: string; // "Science (PCM)", "Science (PCB)", "Commerce", "Arts"
  courseOrDegree?: string;
  targetExams?: string;
  dailyAvailableHours: number;
  studyGoals?: string;
  preferredSchedule?: string;
  stressLevelNotes?: string;
  streakCount: number;
  lastActiveDate: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  profile?: UserProfile;
}

export interface Topic {
  id: string;
  chapterId: string;
  title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  orderIndex: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  orderIndex: number;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon: string;
  examDate?: string;
  targetScore: number;
  syllabusCompletion: number;
  chapters?: Chapter[];
  totalTopics?: number;
  completedTopics?: number;
}

export interface StudyTask {
  id: string;
  userId: string;
  studyPlanId?: string;
  subjectId?: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  durationMin: number;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  subject?: { id: string; name: string; color: string };
  studyPlan?: { id: string; title: string };
}

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  dailyHours: number;
  currentPrepLevel: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  planSummary?: string;
  rawScheduleJson?: string;
  subject?: { id: string; name: string; color: string; icon: string };
  tasks?: StudyTask[];
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  isPinned: boolean;
  tags?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; color: string };
}

export interface Flashcard {
  id: string;
  deckTitle: string;
  chapterTitle?: string;
  topicTitle?: string;
  question: string;
  answer: string;
  keyConcept?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  reviewCount: number;
  masteryStatus: 'LEARNING' | 'MASTERED' | 'NEEDS_REVIEW';
  lastReviewed?: string;
  subjectId?: string;
  subject?: { id: string; name: string; color: string; icon?: string };
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType?: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  options: string[];
  correctIndex: number;
  sampleAnswer?: string;
  keyPoints?: string[];
  explanation?: string;
  orderIndex: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback?: string;
  userAnswersJson?: string;
  evaluationJson?: string;
  timeSpentSeconds?: number;
  breakdown?: Array<{
    questionIndex?: number;
    questionId?: string;
    questionText: string;
    questionType?: string;
    options?: string[];
    selectedAnswer?: any;
    studentAnswer?: string;
    correctAnswer?: number;
    correctIndex?: number;
    userAnswer?: number | null;
    isCorrect?: boolean;
    isAnswered?: boolean;
    score?: number;
    passed?: boolean;
    feedback?: string;
    strengths?: string[];
    mistakes?: string[];
    improvements?: string[];
    modelAnswer?: string;
    explanation?: string;
  }>;
  createdAt: string;
  quiz?: {
    id: string;
    title: string;
    topic?: string;
    chapterTitle?: string;
    quizType?: string;
    subject?: { name: string; color: string };
  };
}

export interface Quiz {
  id: string;
  title: string;
  topic?: string;
  chapterTitle?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  quizType?: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER';
  totalQuestions: number;
  questionsCount?: number;
  subjectId?: string;
  subject?: { id: string; name: string; color: string };
  questions?: QuizQuestion[];
  attempts?: QuizAttempt[];
  attemptsCount?: number;
  latestAttempt?: QuizAttempt | null;
  highestScore?: number | null;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  adaptiveRecommendation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SwitchTeammate {
  id: string;
  roomId: string;
  name: string;
  handle?: string;
  role: string;
  isAdded: boolean;
  joinedAt: string;
}

export interface SwitchRoom {
  id: string;
  userId: string;
  name: string;
  platform: string;
  telegramChatId?: string;
  isShared: boolean;
  teammates: SwitchTeammate[];
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  durationMinutes: number;
  sessionType: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
  notes?: string;
  completedAt: string;
  subject?: { name: string; color: string };
}

export interface AnalyticsData {
  streakCount: number;
  totalStudyHours: number;
  totalStudyMinutes: number;
  dailyHoursTrend: Array<{ date: string; dayLabel: string; hours: number }>;
  subjectProgress: Array<{
    id: string;
    name: string;
    color: string;
    completion: number;
    totalTopics: number;
    completedTopics: number;
    examDate?: string;
  }>;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  quizzes: {
    attemptsCount: number;
    averagePercentage: number;
    totalQuestionsAnswered: number;
  };
  flashcards: {
    total: number;
    mastered: number;
    masteryPercentage: number;
  };
}

export interface AgentAction {
  id: string;
  actionType: string;
  source: string;
  summary: string;
  payloadJson?: string;
  status: 'SUGGESTED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  switchRoomId?: string;
  createdAt: string;
  user?: { name: string; email: string };
}
