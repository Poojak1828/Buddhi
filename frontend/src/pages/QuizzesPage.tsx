import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  BookOpen,
  History,
  X,
  FileText,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  Check,
  Filter,
  BarChart2,
  TrendingUp,
  Target,
  GraduationCap,
  ListFilter,
  Flame,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Quiz, Subject } from '../types/index.js';
import confetti from 'canvas-confetti';

export const QuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NOT_STARTED' | 'COMPLETED'>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  // Active Quiz Playing State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Generator Modal State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genChapterTitle, setGenChapterTitle] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genDifficulty, setGenDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [genCount, setGenCount] = useState(20); // Minimum 20 questions
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, historyRes, subjectsRes] = await Promise.all([
        api.getQuizzes(),
        api.getQuizHistory(),
        api.getSubjects(),
      ]);

      setQuizzes(quizzesRes.quizzes || []);
      setQuizHistory(historyRes.attempts || []);
      setSubjects(subjectsRes.subjects || []);

      if (subjectsRes.subjects && subjectsRes.subjects.length > 0 && !genSubjectId) {
        const firstSub = subjectsRes.subjects[0];
        setGenSubjectId(firstSub.id);
        if (firstSub.chapters && firstSub.chapters.length > 0) {
          setGenChapterTitle(firstSub.chapters[0].title);
          if (firstSub.chapters[0].topics && firstSub.chapters[0].topics.length > 0) {
            setGenTopic(firstSub.chapters[0].topics[0].title);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load quizzes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer effect during active quiz
  useEffect(() => {
    if (activeQuiz && !quizSubmitted) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuiz, quizSubmitted]);

  // Synchronize chapter and topic dropdowns when genSubjectId changes
  useEffect(() => {
    const sub = subjects.find((s) => s.id === genSubjectId);
    if (sub && sub.chapters && sub.chapters.length > 0) {
      setGenChapterTitle(sub.chapters[0].title);
      if (sub.chapters[0].topics && sub.chapters[0].topics.length > 0) {
        setGenTopic(sub.chapters[0].topics[0].title);
      } else {
        setGenTopic('');
      }
    } else {
      setGenChapterTitle('');
      setGenTopic('');
    }
  }, [genSubjectId]);

  const handleStartQuiz = async (quizId: string) => {
    try {
      setLoading(true);
      const res = await api.getQuizById(quizId);
      setActiveQuiz(res.quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setSubmissionResult(null);
      setElapsedSeconds(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to start quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) {
      setGenError('Please select or specify a topic.');
      return;
    }

    setGenerating(true);
    setGenError('');
    try {
      const selectedSub = subjects.find((s) => s.id === genSubjectId);
      const res = await api.generateQuiz({
        subjectId: genSubjectId || undefined,
        subjectName: selectedSub?.name || 'Standard Syllabus',
        chapterTitle: genChapterTitle || undefined,
        topic: genTopic.trim(),
        difficulty: genDifficulty,
        totalQuestions: Math.max(20, genCount),
        quizType: 'MCQ',
      });

      setShowGenerator(false);
      await loadData();
      await handleStartQuiz(res.quizId);
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    // Check unanswered questions
    const totalQ = activeQuiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalQ) {
      const remaining = totalQ - answeredCount;
      if (!confirm(`You have ${remaining} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersArray = activeQuiz.questions.map((_: any, idx: number) => {
        return selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      });

      const result = await api.submitQuiz(activeQuiz.id, answersArray, elapsedSeconds);
      setSubmissionResult(result);
      setQuizSubmitted(true);

      if (result.percentage >= 80) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter quizzes according to active filters
  const filteredQuizzes = quizzes.filter((q) => {
    if (statusFilter === 'NOT_STARTED' && q.status === 'COMPLETED') return false;
    if (statusFilter === 'COMPLETED' && q.status !== 'COMPLETED') return false;
    if (subjectFilter !== 'ALL' && q.subjectId !== subjectFilter) return false;
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  // Calculate overall performance metrics
  const totalCompletedQuizzes = quizzes.filter((q) => q.status === 'COMPLETED').length;
  const averageScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce((acc, a) => acc + a.percentage, 0) / quizHistory.length
        )
      : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* ========================================================
          SCREEN 1: DEDICATED QUIZ ATTEMPT SCREEN (NEW SCREEN)
          ======================================================== */}
      {activeQuiz ? (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Top Header Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0D1527] border border-sky-500/30 shadow-2xl">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => {
                  if (quizSubmitted || confirm('Exit this quiz session? Unsaved progress will be lost.')) {
                    setActiveQuiz(null);
                    loadData();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700/60 flex items-center gap-1.5 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back to Quizzes
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white truncate">
                  {activeQuiz.topic || activeQuiz.title}
                </h1>
                {activeQuiz.chapterTitle && (
                  <p className="text-xs text-sky-400 font-medium">Subtopic: {activeQuiz.chapterTitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              {/* Timer Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono font-bold text-sky-400 shadow-inner">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>

              {/* Question Count Pill */}
              <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                Q {currentQuestionIndex + 1} / {activeQuiz.questions.length}
              </span>
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / (activeQuiz.questions.length || 1)) * 100}%`,
              }}
            ></div>
          </div>

          {/* Question Jump Palette (Minimum 10 Questions) */}
          <div className="p-4 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                Question Palette ({activeQuiz.questions.length} Questions)
              </span>
              <span className="font-mono text-slate-300">
                {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length} Answered
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {activeQuiz.questions.map((_: any, idx: number) => {
                const isCurrent = currentQuestionIndex === idx;
                const isAnswered = selectedAnswers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-black flex items-center justify-center shrink-0 transition border ${
                      isCurrent
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md ring-2 ring-sky-400/40'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Box */}
          {activeQuiz.questions[currentQuestionIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-sky-400 uppercase tracking-widest text-xs font-mono">
                    Question #{currentQuestionIndex + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                    Single Choice
                  </span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {activeQuiz.questions[currentQuestionIndex].questionText}
                </p>
              </div>

              {/* 4 Answer Options */}
              <div className="space-y-3">
                {activeQuiz.questions[currentQuestionIndex].options.map((opt: string, optIdx: number) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                  const isSubmitted = quizSubmitted;
                  const isCorrect = optIdx === activeQuiz.questions[currentQuestionIndex].correctIndex;

                  let optionStyle = 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600 text-slate-200';
                  if (isSelected && !isSubmitted) {
                    optionStyle = 'bg-sky-500/15 border-sky-500 text-white shadow-md ring-1 ring-sky-500/30';
                  } else if (isSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                      className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-semibold transition flex items-center justify-between border ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>
                      {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Shown after submission) */}
              {quizSubmitted && activeQuiz.questions[currentQuestionIndex].explanation && (
                <div className="p-4 rounded-2xl bg-[#080C14] border border-sky-500/30 space-y-1.5 animate-fade-in">
                  <span className="text-[11px] font-extrabold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" /> Conceptual Explanation:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeQuiz.questions[currentQuestionIndex].explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation & Submission Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-30 transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {!quizSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {submitting ? 'Evaluating Assessment...' : `Submit Assessment (${activeQuiz.questions.length} Qs)`}
              </button>
            ) : (
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  loadData();
                }}
                className="px-7 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-sky-500/20"
              >
                ← Back to Quiz Directory
              </button>
            )}

            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === activeQuiz.questions.length - 1}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-30 transition flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* RESULTS CARD IF SUBMITTED */}
          {quizSubmitted && submissionResult && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0A0F1D] border border-sky-500/30 space-y-6 animate-fade-in shadow-2xl">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Assessment Completed
                </span>
                <h3 className="text-3xl font-black text-white">
                  Score: <span className="text-sky-400">{submissionResult.percentage}%</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">{submissionResult.feedback}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Questions</span>
                  <p className="text-lg font-black text-white mt-1">{submissionResult.totalQuestions}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/20">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Correct</span>
                  <p className="text-lg font-black text-emerald-400 mt-1">{submissionResult.correctCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/20">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Incorrect</span>
                  <p className="text-lg font-black text-rose-400 mt-1">{submissionResult.incorrectCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Time Taken</span>
                  <p className="text-lg font-black text-sky-400 mt-1">
                    {formatTime(submissionResult.timeSpentSeconds || elapsedSeconds)}
                  </p>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    loadData();
                  }}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs transition shadow-lg shadow-sky-500/25"
                >
                  ← Return to Quiz Directory (View Score)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
           SCREEN 2: QUIZZES DIRECTORY SCREEN (CLEAN TOPIC LIST)
           ======================================================== */
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-extrabold border border-indigo-500/25 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Minimum 10 Questions Standard
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-medium">Topic Diagnostic Testing</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                <HelpCircle className="w-7 h-7 text-sky-400" />
                Practice Quizzes & Assessments
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Select any topic or subtopic below to begin your diagnostic assessment. Click any quiz to attempt it.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGenerator(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition ring-1 ring-white/10"
              >
                <Sparkles className="w-4 h-4" /> Generate New Quiz
              </button>
            </div>
          </div>

          {/* QUIZZES FILTERS BAR */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Quiz Directory</h2>
              </div>

              {/* Status Tabs: All, Not Started, Completed */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
                {(['ALL', 'NOT_STARTED', 'COMPLETED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg transition ${
                      statusFilter === tab
                        ? 'bg-sky-500 text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Quizzes' : tab === 'NOT_STARTED' ? 'Not Started' : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Dropdown */}
            {subjects.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Filter by Subject</label>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full sm:w-72 h-10 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white"
                >
                  <option value="ALL">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CLEAN LIST OF QUIZZES: ALIGNED BY TOPIC NAME & SUBTOPIC NAME ONLY */}
          <div className="space-y-3">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl shimmer-loader border border-slate-800"></div>
              ))
            ) : filteredQuizzes.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#0D1527] border border-dashed border-slate-800 text-slate-400 space-y-4">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <div>
                  <p className="text-base font-bold text-slate-200">No quizzes found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate a new topic diagnostic assessment to test your active recall.
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <Sparkles className="w-4 h-4" /> Generate New Quiz
                </button>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => {
                const isCompleted = quiz.status === 'COMPLETED' || (quiz.attemptsCount && quiz.attemptsCount > 0);
                const topicName = quiz.topic || quiz.title;
                const subtopicName = quiz.chapterTitle && quiz.chapterTitle !== topicName ? quiz.chapterTitle : null;
                const score = quiz.highestScore ?? quiz.latestAttempt?.percentage;

                return (
                  <div
                    key={quiz.id}
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="p-5 sm:p-6 rounded-2xl bg-[#0F172A]/90 border border-slate-800/90 hover:border-sky-500/50 hover:bg-slate-900/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm group cursor-pointer"
                  >
                    {/* Aligned by Topic Name and Subtopic Name only */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                        <HelpCircle className="w-5 h-5 text-sky-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors truncate">
                          {topicName}
                        </h3>
                        {subtopicName && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Subtopic: <span className="text-slate-300 font-semibold">{subtopicName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Status/Score & Action Button */}
                    <div className="flex items-center gap-3.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      {isCompleted ? (
                        <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Completed • {score !== undefined && score !== null ? `${score}%` : 'Done'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/80">
                          Not Started
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartQuiz(quiz.id);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-md shadow-sky-500/20"
                      >
                        <span>{isCompleted ? 'Retake Quiz' : 'Attempt Quiz'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* GENERATE NEW QUIZ MODAL */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-sky-500/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  Generate New Diagnostic Assessment
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every quiz contains at least 20 questions grounded in your syllabus with answer explanations.
                </p>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {genError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateQuiz} className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject</label>
                <select
                  value={genSubjectId}
                  onChange={(e) => setGenSubjectId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-semibold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Chapter Title</label>
                <select
                  value={genChapterTitle}
                  onChange={(e) => {
                    setGenChapterTitle(e.target.value);
                    const sub = subjects.find((s) => s.id === genSubjectId);
                    const ch = sub?.chapters?.find((c) => c.title === e.target.value);
                    if (ch && ch.topics && ch.topics.length > 0) {
                      setGenTopic(ch.topics[0].title);
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500"
                >
                  {subjects
                    .find((s) => s.id === genSubjectId)
                    ?.chapters?.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Topic Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Topic or Concept *</label>
                <input
                  type="text"
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Rolling Motion Without Slipping & Energy Conservation"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-medium"
                />
              </div>

              {/* Difficulty with Adaptive Recommendation Indicator */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Difficulty Level</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-semibold"
                  >
                    <option value="EASY">Easy (Foundational)</option>
                    <option value="MEDIUM">Medium (Curriculum Standard)</option>
                    <option value="HARD">Hard (Competitive & Multi-Step)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Questions Count (Min 20)
                  </label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-extrabold"
                  >
                    <option value={20}>20 Questions (Standard Specification)</option>
                    <option value={25}>25 Questions (Extended Practice)</option>
                    <option value={30}>30 Questions (Full Mock Assessment)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 disabled:opacity-50 ring-1 ring-white/20"
                >
                  {generating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" /> Synthesizing 20 Questions from Syllabus...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Synthesize & Launch 20-Question Quiz
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
