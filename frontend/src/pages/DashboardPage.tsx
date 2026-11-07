import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  CheckCircle2,
  ListTodo,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Timer,
  Network,
  HelpCircle,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';
import { Subject, StudyTask, AnalyticsData } from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentAction, setRecentAction] = useState<any>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, subjectsRes, analyticsRes, switchStatusRes] = await Promise.all([
        api.getTasks(),
        api.getSubjects(),
        api.getAnalytics(),
        api.getSwitchStatus(),
      ]);

      setTasks(tasksRes.tasks);
      setSubjects(subjectsRes.subjects);
      setAnalytics(analyticsRes);
      setRecentAction(switchStatusRes.lastAction);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleTask = async (task: StudyTask) => {
    const newStatus = !task.isCompleted;
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: newStatus, status: newStatus ? 'COMPLETED' : 'PENDING' } : t))
      );

      await api.updateTask(task.id, { isCompleted: newStatus });

      if (newStatus) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      }

      // Refresh analytics
      const updatedAnalytics = await api.getAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      loadDashboardData();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 font-sans animate-fade-in">
      {/* 1. Hero Greeting Banner & Psychological Wellness Check-in */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0D1527] via-[#0F172A] to-[#0A0F1D] border border-white/10 shadow-2xl">
        {/* Subtle ambient background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30 shadow-sm shadow-sky-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                <span>Active Track: {user?.profile?.courseOrDegree || 'General Academic Prep'}</span>
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Cognitive Pacing: Balanced 🌿
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {getGreeting()}, <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">{user?.name || 'Student'}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              "Consistency outperforms intensity every single time. Tackle one micro-concept with intention, celebrate small completions, and trust your pace."
            </p>
          </div>

          {/* Quick Action Launchers */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/timer')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 transition flex items-center gap-2 shadow-sm hover:border-slate-600"
            >
              <Timer className="w-4 h-4 text-purple-400" />
              Focus Timer
            </button>
            <button
              onClick={() => navigate('/planner')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 transition flex items-center gap-2 shadow-sm hover:border-slate-600"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              New Study Plan
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition flex items-center gap-2 ring-1 ring-white/20"
            >
              <Sparkles className="w-4 h-4" />
              Ask Buddhi Tutor
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer-loader border border-slate-800/80"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Card */}
          <div className="p-5 rounded-2xl bg-[#0F172A]/80 border border-white/5 hover:border-amber-500/30 transition-all duration-200 shadow-lg flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400">Study Streak</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1 tracking-tight">
                {analytics?.streakCount || user?.profile?.streakCount || 1} Days
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Continuous daily habit</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Flame className="w-6 h-6 fill-amber-400/25 text-amber-400" />
            </div>
          </div>

          {/* Total Study Time */}
          <div className="p-5 rounded-2xl bg-[#0F172A]/80 border border-white/5 hover:border-sky-500/30 transition-all duration-200 shadow-lg flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400">Total Focus Time</p>
              <p className="text-2xl font-extrabold text-sky-400 mt-1 tracking-tight">
                {analytics?.totalStudyHours || 0} Hours
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{analytics?.totalStudyMinutes || 0} min in sessions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <Clock className="w-6 h-6 text-sky-400" />
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="p-5 rounded-2xl bg-[#0F172A]/80 border border-white/5 hover:border-indigo-500/30 transition-all duration-200 shadow-lg flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400">Tasks Pipeline</p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1 tracking-tight">
                {pendingTasks.length} Pending
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{completedTasks.length} milestones completed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <ListTodo className="w-6 h-6 text-indigo-400" />
            </div>
          </div>

          {/* Quiz Accuracy */}
          <div className="p-5 rounded-2xl bg-[#0F172A]/80 border border-white/5 hover:border-emerald-500/30 transition-all duration-200 shadow-lg flex items-center justify-between group">
            <div>
              <p className="text-xs font-semibold text-slate-400">Quiz Accuracy</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1 tracking-tight">
                {analytics?.quizzes?.averagePercentage || 0}%
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{analytics?.quizzes?.attemptsCount || 0} diagnostic attempts</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Switch Teammate Synchronization Pill */}
      {recentAction && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0F172A] to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                <span>Switch Room Activity Sync</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 rounded-md font-mono border border-emerald-500/30">
                  {recentAction.source}
                </span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{recentAction.summary}</p>
            </div>
          </div>
          <Link
            to="/switch-hub"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition shrink-0"
          >
            Inspect Switch Hub →
          </Link>
        </div>
      )}

      {/* 4. Two Columns: Today's Tasks & Syllabus Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-sky-400" />
                  Today's Study Action Items
                </h2>
                <p className="text-xs text-slate-400">Click circle to mark completed and trigger celebration</p>
              </div>
              <Link
                to="/planner"
                className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 group"
              >
                <span>Plan Tasks</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl shimmer-loader border border-slate-800"></div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">No study tasks scheduled for today</p>
                  <p className="text-xs text-slate-500 mt-1">Let Buddhi generate a structured milestone study plan for you.</p>
                </div>
                <Link
                  to="/planner"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:brightness-110 transition"
                >
                  <Plus className="w-4 h-4" /> Generate AI Study Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 group ${
                      task.isCompleted
                        ? 'bg-slate-900/30 border-slate-800/40 opacity-60'
                        : 'bg-slate-900/70 border-white/5 hover:border-sky-500/30 hover:bg-slate-900/90 shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950 scale-105 shadow-sm shadow-emerald-500/50'
                          : 'border-slate-600 group-hover:border-sky-400'
                      }`}
                    >
                      {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold ${
                            task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100 group-hover:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.subject && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                            style={{
                              backgroundColor: `${task.subject.color}15`,
                              borderColor: `${task.subject.color}35`,
                              color: task.subject.color,
                            }}
                          >
                            {task.subject.name}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide border ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700/60'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1.5 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-800">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {task.durationMin}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Focus Trend Visualizer with Scaled Axes and Multi-Color Bars */}
          <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Daily Focus Hours (Past 7 Days)
                </h2>
                <p className="text-xs text-slate-400">Scaled study time (Y: Hours, X: Date) tracked via PostgreSQL</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                  Avg: {((analytics?.dailyHoursTrend?.reduce((acc, d) => acc + d.hours, 0) || 0) / 7).toFixed(1)}h/day
                </span>
                <span className="text-xs font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                  {analytics?.dailyHoursTrend?.reduce((acc, d) => acc + d.hours, 0).toFixed(1) || 0}h Total
                </span>
              </div>
            </div>

            {/* Scaled Bar Chart Container */}
            <div className="relative pt-6 pb-2">
              {/* Y-Axis Gridlines & Time Labels */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pr-1">
                {[6, 4, 2, 0].map((tick, i) => (
                  <div key={i} className="flex items-center w-full">
                    <span className="text-[10px] font-mono text-slate-500 w-6 shrink-0">{tick}h</span>
                    <div className="w-full border-b border-slate-800/80 border-dashed ml-1"></div>
                  </div>
                ))}
              </div>

              {/* Multi-Colored Daily Bars */}
              <div className="relative z-10 flex items-end justify-between gap-2.5 sm:gap-3 h-52 pl-7 pr-1">
                {analytics?.dailyHoursTrend?.map((item, idx) => {
                  const maxScale = Math.max(6, ...analytics.dailyHoursTrend.map((d) => d.hours));
                  const heightPercent = Math.max(10, Math.round((item.hours / maxScale) * 100));

                  // Vibrant multi-color palette per bar
                  const barColorPalette = [
                    { bg: 'from-violet-600 via-purple-500 to-fuchsia-400', glow: 'shadow-purple-500/25', text: 'text-violet-300', border: 'border-purple-500/30', pillBg: 'bg-purple-950/70' },
                    { bg: 'from-blue-600 via-sky-500 to-cyan-400', glow: 'shadow-sky-500/25', text: 'text-sky-300', border: 'border-sky-500/30', pillBg: 'bg-sky-950/70' },
                    { bg: 'from-emerald-600 via-teal-500 to-teal-300', glow: 'shadow-teal-500/25', text: 'text-emerald-300', border: 'border-teal-500/30', pillBg: 'bg-teal-950/70' },
                    { bg: 'from-amber-600 via-orange-500 to-yellow-300', glow: 'shadow-amber-500/25', text: 'text-amber-300', border: 'border-amber-500/30', pillBg: 'bg-amber-950/70' },
                    { bg: 'from-rose-600 via-pink-500 to-rose-400', glow: 'shadow-rose-500/25', text: 'text-rose-300', border: 'border-rose-500/30', pillBg: 'bg-rose-950/70' },
                    { bg: 'from-indigo-600 via-indigo-500 to-blue-400', glow: 'shadow-indigo-500/25', text: 'text-indigo-300', border: 'border-indigo-500/30', pillBg: 'bg-indigo-950/70' },
                    { bg: 'from-cyan-600 via-teal-500 to-emerald-400', glow: 'shadow-cyan-500/25', text: 'text-cyan-300', border: 'border-cyan-500/30', pillBg: 'bg-cyan-950/70' },
                  ];

                  const theme = barColorPalette[idx % barColorPalette.length];

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                      {/* Floating Time Pill */}
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${theme.text} ${theme.pillBg} ${theme.border} transition group-hover:scale-110 shadow-sm`}>
                        {item.hours}h
                      </span>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[38px] bg-slate-900/90 rounded-t-xl overflow-hidden flex items-end p-0.5 border border-slate-800/80 shadow-inner">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg bg-gradient-to-t ${theme.bg} transition-all duration-500 group-hover:scale-y-105 origin-bottom shadow-lg ${theme.glow}`}
                        ></div>
                      </div>

                      {/* X-Axis Date & Day Labels */}
                      <div className="text-center pt-1 border-t border-slate-800/80 w-full">
                        <span className="text-[11px] font-bold text-slate-200 block">
                          {item.dayLabel}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 block tracking-tight">
                          {item.date ? item.date.slice(5) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Axis Legends */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2 px-1">
                <span>↑ Y-Axis: Time (Hours)</span>
                <span>X-Axis: Calendar Date →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subjects & Syllabus Progress (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Syllabus Mastery
              </h2>
              <Link to="/subjects" className="text-xs text-sky-400 hover:text-sky-300 font-bold">
                Manage All →
              </Link>
            </div>

            <div className="space-y-3.5">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2.5 hover:border-slate-700/80 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: sub.color }}></span>
                      <span className="text-xs font-bold text-slate-100">{sub.name}</span>
                    </div>
                    <span className="text-xs font-extrabold font-mono" style={{ color: sub.color }}>
                      {sub.syllabusCompletion}%
                    </span>
                  </div>

                  {/* Progress Bar with glow */}
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${sub.syllabusCompletion}%`,
                        backgroundColor: sub.color,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Target: {sub.targetScore}%</span>
                    <span>
                      {sub.examDate
                        ? `Exam: ${new Date(sub.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        : 'No exam date'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Action Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-[#0F172A] to-slate-900 border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recommended Next Action
            </span>
            <h3 className="text-sm font-bold text-white">Rotational Mechanics Active Recall</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Review your 3 flashcards on Moment of Inertia for 15 minutes to cement today's derivations before starting new material.
            </p>
            <div className="pt-2">
              <Link
                to="/flashcards"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
              >
                Start Flashcard Session <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
