import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  Flame,
  CheckCircle2,
  Award,
  BookOpen,
  PieChart as PieIcon,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api.js';
import { AnalyticsData, Subject } from '../types/index.js';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, subjectsRes] = await Promise.all([
          api.getAnalytics(),
          api.getSubjects(),
        ]);
        setData(analyticsRes);
        setSubjects(subjectsRes.subjects || []);
        if (subjectsRes.subjects && subjectsRes.subjects.length > 0) {
          setSelectedSubjectId(subjectsRes.subjects[0].id);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans animate-fade-in">
        <div className="h-16 rounded-2xl shimmer-loader border border-slate-800"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl shimmer-loader border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-80 rounded-3xl shimmer-loader border border-slate-800"></div>
          <div className="lg:col-span-5 h-80 rounded-3xl shimmer-loader border border-slate-800"></div>
        </div>
      </div>
    );
  }

  const weeklyHoursTotal = data.dailyHoursTrend.reduce((acc, d) => acc + d.hours, 0);
  const maxHoursInWeek = Math.max(4, ...data.dailyHoursTrend.map((d) => d.hours));

  // Compute breakdown for currently selected subject
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const allTopicsInSubject = selectedSubject?.chapters?.flatMap((c) => c.topics) || [];
  const completedTopicsCount = allTopicsInSubject.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTopicsCount = allTopicsInSubject.filter((t) => t.status === 'IN_PROGRESS').length;
  const notStartedTopicsCount = Math.max(0, allTopicsInSubject.length - completedTopicsCount - inProgressTopicsCount);
  const totalTopicsCount = allTopicsInSubject.length || 1; // avoid divide by 0

  const completedPct = Math.round((completedTopicsCount / totalTopicsCount) * 100);
  const inProgressPct = Math.round((inProgressTopicsCount / totalTopicsCount) * 100);
  const notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);

  // SVG Pie chart calculation (stroke-dasharray based on circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const completedStroke = (completedPct / 100) * circumference;
  const inProgressStroke = (inProgressPct / 100) * circumference;
  const notStartedStroke = (notStartedPct / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            Academic Progress & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time quantitative feedback calculated directly from your study sessions, syllabus topics, and quiz attempts.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0F172A]/90 border border-white/5 hover:border-amber-500/30 transition shadow-lg flex items-center justify-between group">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Study Streak</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1 tracking-tight">{data.streakCount} Days</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active habit consistency</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Flame className="w-6 h-6 fill-amber-400/25" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0F172A]/90 border border-white/5 hover:border-sky-500/30 transition shadow-lg flex items-center justify-between group">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Total Study Time</span>
            <p className="text-2xl font-extrabold text-sky-400 mt-1 tracking-tight">{data.totalStudyHours} Hours</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.totalStudyMinutes} mins logged</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0F172A]/90 border border-white/5 hover:border-indigo-500/30 transition shadow-lg flex items-center justify-between group">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Task Completion</span>
            <p className="text-2xl font-extrabold text-indigo-400 mt-1 tracking-tight">{data.tasks.completionRate}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.tasks.completed} of {data.tasks.total} tasks</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0F172A]/90 border border-white/5 hover:border-emerald-500/30 transition shadow-lg flex items-center justify-between group">
          <div>
            <span className="text-xs text-slate-400 font-semibold">Quiz Accuracy</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1 tracking-tight">{data.quizzes.averagePercentage}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{data.quizzes.totalQuestionsAnswered} questions tested</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Primary Graphs Row: Hours of Study Bar Graph + Subject Topic Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 1. Hours of Study Bar Graph (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" /> Study Hours Bar Graph
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Recorded study hours across the past 7 days</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono font-extrabold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 block">
                  {weeklyHoursTotal.toFixed(1)} hrs total
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">Avg {(weeklyHoursTotal / 7).toFixed(1)} hrs / day</p>
              </div>
            </div>
          </div>

          {/* Key Stat Badges Row */}
          <div className="grid grid-cols-3 gap-2.5 py-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Studied</span>
              <span className="text-sm font-black text-white font-mono mt-0.5 block">{weeklyHoursTotal.toFixed(1)}h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Daily Average</span>
              <span className="text-sm font-black text-sky-400 font-mono mt-0.5 block">{(weeklyHoursTotal / 7).toFixed(1)}h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Peak Session</span>
              <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">{Math.max(0, ...data.dailyHoursTrend.map(d => d.hours)).toFixed(1)}h</span>
            </div>
          </div>

          {/* Bar Chart Container with Y-Axis and Grid Lines */}
          <div className="relative pt-6 pb-2">
            {/* Background Gridlines & Y-Axis Labels */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-12 pr-2">
              {[6, 4, 2, 0].map((tick, i) => (
                <div key={i} className="flex items-center w-full">
                  <span className="text-[10px] font-mono text-slate-500 w-6 shrink-0">{tick}h</span>
                  <div className="w-full border-b border-slate-800/80 border-dashed ml-1"></div>
                </div>
              ))}
            </div>

            {/* The 7 Daily Bars */}
            <div className="relative z-10 flex items-end justify-between gap-3 h-56 pl-7 pr-2">
              {data.dailyHoursTrend.map((item, idx) => {
                const maxScale = Math.max(6, Math.max(...data.dailyHoursTrend.map((d) => d.hours)));
                const heightPercent = Math.max(8, Math.round((item.hours / maxScale) * 100));

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
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                    {/* Floating Value Pill */}
                    <span
                      className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded-md border ${theme.text} ${theme.pillBg} ${theme.border} transition-all group-hover:scale-110 shadow-sm`}
                    >
                      {item.hours}h
                    </span>

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[42px] bg-slate-900/90 rounded-t-xl overflow-hidden flex items-end p-1 border border-slate-800/60 shadow-inner">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 group-hover:scale-y-105 origin-bottom shadow-lg bg-gradient-to-t ${theme.bg} ${theme.glow}`}
                      ></div>
                    </div>

                    {/* Day & Date Labels */}
                    <div className="text-center pt-1 border-t border-slate-800/80 w-full">
                      <span className="text-xs font-bold block text-slate-200">
                        {item.dayLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {item.date ? item.date.slice(5) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Axis Legends */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-2 px-7">
              <span>↑ Y-Axis: Time (Hours)</span>
              <span>X-Axis: Calendar Date →</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              Optimal brain retention is achieved at 4–5 focused study hours with 10-minute pauses.
            </span>
            <span className="text-sky-400 font-semibold text-[11px]">Active Habit</span>
          </div>
        </div>

        {/* 2. Individual Subject Topic Coverage Pie Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" /> Subject Topic Coverage
              </h2>
              <p className="text-xs text-slate-400">Distribution of topics in syllabus</p>
            </div>

            {/* Subject Selector Dropdown */}
            {subjects.length > 0 && (
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 pr-7 focus:outline-none focus:border-sky-500 appearance-none font-semibold cursor-pointer"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Donut / Pie Chart & Breakdown */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* SVG Pie Graphic */}
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="text-slate-800/80"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Not Started Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#334155"
                  strokeWidth="12"
                  strokeDasharray={`${notStartedStroke} ${circumference}`}
                  strokeDashoffset="0"
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* In Progress Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#0284C7"
                  strokeWidth="12"
                  strokeDasharray={`${inProgressStroke} ${circumference}`}
                  strokeDashoffset={`-${notStartedStroke}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Completed Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${completedStroke} ${circumference}`}
                  strokeDashoffset={`-${notStartedStroke + inProgressStroke}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>

              {/* Center percentage */}
              <div className="absolute text-center">
                <span className="text-2xl font-black text-emerald-400 font-mono">{completedPct}%</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mastered</p>
              </div>
            </div>

            {/* Legend & Topic Counts */}
            <div className="space-y-3 w-full sm:w-auto">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                  Completed Topics
                </span>
                <span className="font-mono font-bold text-emerald-400">{completedTopicsCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></span>
                  In Progress Topics
                </span>
                <span className="font-mono font-bold text-sky-400">{inProgressTopicsCount}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="w-3 h-3 rounded-full bg-slate-600"></span>
                  Pending / To Study
                </span>
                <span className="font-mono font-bold text-slate-400">{notStartedTopicsCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Subject: <strong className="text-white">{selectedSubject?.name || 'All'}</strong></span>
            <span>Total Topics: <strong className="text-white font-mono">{allTopicsInSubject.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary Subject Progress Bars */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" /> All Subjects Overview
          </h2>
          <span className="text-xs text-slate-400 font-bold">Curriculum Completion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {data.subjectProgress.map((subj) => (
            <div key={subj.id} className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-100">{subj.name}</span>
                <span className="font-mono font-extrabold" style={{ color: subj.color }}>
                  {subj.completion}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${subj.completion}%`,
                    backgroundColor: subj.color,
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{subj.completedTopics} of {subj.totalTopics} topics</span>
                <span>{subj.examDate ? `Exam: ${new Date(subj.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Ongoing'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
