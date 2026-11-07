import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';

const CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const STREAMS = [
  { id: 'Science (PCM)', label: 'Science (PCM)', desc: 'Physics, Chemistry, Mathematics' },
  { id: 'Science (PCB)', label: 'Science (PCB)', desc: 'Physics, Chemistry, Biology' },
  { id: 'Commerce', label: 'Commerce', desc: 'Accountancy, Business Studies, Economics' },
  { id: 'Arts', label: 'Arts / Humanities', desc: 'History, Political Science, Geography' },
];

const BOARDS = [
  { id: 'CBSE', label: 'CBSE', desc: 'Central Board of Secondary Education' },
  { id: 'ICSE', label: 'ICSE / ISC', desc: 'Council for the Indian School Certificate' },
  { id: 'State Board', label: 'State Board', desc: 'State Curriculum Board' },
];

export const OnboardingPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [gradeClass, setGradeClass] = useState(user?.profile?.gradeClass || 'Class 12');
  const [board, setBoard] = useState(user?.profile?.board || 'CBSE');
  const [stream, setStream] = useState(user?.profile?.stream || 'Science (PCM)');
  const [targetExams, setTargetExams] = useState(user?.profile?.targetExams || 'Board Examination & Entrance 2026');
  const [dailyAvailableHours, setDailyAvailableHours] = useState(4.5);
  const [preferredSchedule, setPreferredSchedule] = useState('EVENING');
  const [studyGoals, setStudyGoals] = useState(
    'Master concepts with deep clarity, reduce exam stress, and maintain a 30-day streak.'
  );
  const [loading, setLoading] = useState(false);

  const isSeniorClass = gradeClass === 'Class 11' || gradeClass === 'Class 12';

  const handleFinish = async () => {
    setLoading(true);
    try {
      const academicLevel = isSeniorClass ? 'SENIOR_SECONDARY_PREP' : 'SCHOOL_SECONDARY';
      const courseOrDegree = isSeniorClass ? `${gradeClass} ${stream} (${board})` : `${gradeClass} (${board})`;

      // 1. Update user profile
      await updateProfile({
        academicLevel,
        gradeClass,
        board,
        stream: isSeniorClass ? stream : undefined,
        courseOrDegree,
        targetExams,
        dailyAvailableHours,
        preferredSchedule,
        studyGoals,
      });

      // 2. Automatically populate standard curriculum & flashcards for this specific class & board!
      await api.autoPopulateCurriculum({
        gradeClass,
        board,
        stream: isSeniorClass ? stream : undefined,
        targetExams,
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('[Onboarding Error]:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 font-mono drop-shadow-sm">BUDDHI</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Personalize Your AI Academic Path</h2>
        <p className="mt-1 text-xs text-slate-400">Step {step} of 3 • Syllabus automatically tailored to your exact class and board</p>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-sky-500' : 'w-2 bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-sky-500' : 'w-2 bg-slate-800'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-sky-500' : 'w-2 bg-slate-800'}`}></div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#0F172A] p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          {/* STEP 1: Class, Stream & Board */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-400" />
                  Select Your Current Class / Standard
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setGradeClass(cls)}
                      className={`p-2.5 rounded-xl text-center border font-semibold text-xs transition-all ${
                        gradeClass === cls
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stream Selector: Only for Class 11 and 12 */}
              {isSeniorClass && (
                <div className="animate-fade-in p-4 rounded-xl bg-slate-900/80 border border-sky-500/30">
                  <label className="block text-xs font-semibold text-sky-400 mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    Select Stream (Class 11–12)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STREAMS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStream(s.id)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          stream === s.id
                            ? 'border-sky-500 bg-sky-500/20 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs text-slate-200">{s.label}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Board Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400" />
                  Select Educational Board
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {BOARDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBoard(b.id)}
                      className={`p-3 rounded-xl text-center border transition-all ${
                        board === b.id
                          ? 'border-sky-500 bg-sky-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-200">{b.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Buddhi will auto-populate verified syllabus chapters, topics, and flashcards for <strong>{gradeClass} {isSeniorClass ? stream : ''} ({board})</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                Next Step: Target Exams & Routine
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Exams & Study Hours */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Upcoming Target Examinations / Deadlines
                </label>
                <input
                  type="text"
                  value={targetExams}
                  onChange={(e) => setTargetExams(e.target.value)}
                  placeholder="e.g. CBSE Final Exam March 2026 / JEE May 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Daily Available Self-Study Time
                  </span>
                  <span className="text-sky-400 font-bold">{dailyAvailableHours} Hours / Day</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={dailyAvailableHours}
                  onChange={(e) => setDailyAvailableHours(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Buddhi calibrates structured study sessions with rest intervals to prevent mental fatigue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Preferred Peak Focus Time
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPreferredSchedule(time)}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition ${
                        preferredSchedule === time
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  Next: Goals & Mental Reset
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Goals & Psychological Check-in */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Primary Study Goal
                </label>
                <textarea
                  rows={3}
                  value={studyGoals}
                  onChange={(e) => setStudyGoals(e.target.value)}
                  placeholder="What is your biggest aspiration for this semester/year?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Psychological Well-being Commitment
                </p>
                <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                  Buddhi is calibrated to speak to you with empathy. If your progress decelerates or you feel low, your schedule will adapt with zero guilt.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-95 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Populating Standard Syllabus...' : 'Launch Buddhi Study Portal'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
