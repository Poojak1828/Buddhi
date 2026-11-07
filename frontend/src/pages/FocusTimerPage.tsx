import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Subject, StudySession } from '../types/index.js';
import confetti from 'canvas-confetti';

export const FocusTimerPage: React.FC = () => {
  const [mode, setMode] = useState<'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK'>('POMODORO');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);

  const modeDurations = {
    POMODORO: 25 * 60,
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60,
  };

  const loadData = async () => {
    try {
      const [subjRes, sessRes] = await Promise.all([
        api.getSubjects(),
        api.getSessionHistory(),
      ]);
      setSubjects(subjRes.subjects);
      setRecentSessions(sessRes.sessions);
      if (subjRes.subjects.length > 0) {
        setSelectedSubjectId(subjRes.subjects[0].id);
      }
    } catch (err) {
      console.error('Failed to load timer data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleCompleteSession();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const switchMode = (newMode: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(modeDurations[newMode]);
  };

  const handleCompleteSession = async () => {
    setIsRunning(false);
    confetti({ particleCount: 70, spread: 60 });

    const durationMins = Math.round(modeDurations[mode] / 60);

    try {
      await api.logFocusSession({
        durationMinutes: durationMins,
        sessionType: mode,
        subjectId: selectedSubjectId || undefined,
        notes: sessionNotes || undefined,
      });

      // Reload sessions
      const sessRes = await api.getSessionHistory();
      setRecentSessions(sessRes.sessions);
      setSessionNotes('');
      alert(`Session complete! Logged ${durationMins} minutes to your study history.`);
      switchMode(mode === 'POMODORO' ? 'SHORT_BREAK' : 'POMODORO');
    } catch (err) {
      console.error('Failed to log session:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.round(
    ((modeDurations[mode] - timeLeft) / modeDurations[mode]) * 100
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Timer className="w-6 h-6 text-sky-400" />
            Pomodoro Focus Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain deliberate focus intervals and protect your cognitive stamina with structured decompression breaks.
          </p>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl text-center space-y-8 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isRunning ? 'bg-sky-500/15 scale-110' : 'bg-slate-800/20 scale-100'
        }`}></div>

        {/* Mode Selector Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 gap-1.5 shadow-inner relative z-10">
          <button
            type="button"
            onClick={() => switchMode('POMODORO')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mode === 'POMODORO'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-4 h-4" /> Deep Focus (25m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('SHORT_BREAK')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mode === 'SHORT_BREAK'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" /> Short Break (5m)
          </button>
          <button
            type="button"
            onClick={() => switchMode('LONG_BREAK')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              mode === 'LONG_BREAK'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coffee className="w-4 h-4" /> Long Break (15m)
          </button>
        </div>

        {/* Big Circular Countdown Display */}
        <div className="flex flex-col items-center justify-center py-4 relative z-10">
          <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
            {/* SVG Radial Progress Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-1000 ${
                  mode === 'POMODORO'
                    ? 'stroke-sky-400'
                    : mode === 'SHORT_BREAK'
                    ? 'stroke-emerald-400'
                    : 'stroke-indigo-400'
                }`}
                strokeWidth="4"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Digits */}
            <div className="absolute flex flex-col items-center">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white select-none">
                {formatTime(timeLeft)}
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                {isRunning ? 'Interval Active' : 'Session Paused'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 relative z-10">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-extrabold text-sm transition flex items-center gap-2 shadow-xl ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white shadow-sky-500/25 ring-1 ring-white/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" /> Pause Timer
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" /> Start Deep Focus
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(modeDurations[mode]);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Tag Subject to Session */}
        <div className="max-w-md mx-auto pt-4 border-t border-slate-800/80 flex items-center justify-center gap-3 relative z-10 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Associate Academic Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="h-9 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-medium"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Psychological Stamina Insight */}
      <div className="p-5 rounded-2xl bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300 flex items-start gap-3 leading-relaxed">
        <Brain className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-sky-300 font-bold block mb-0.5">Neuroscience Principle: Why 25 Minutes?</strong>
          The prefrontal cortex maintains maximal alpha-wave cognitive focus for 20–30 minutes before metabolic micro-fatigue accumulates. Short 5-minute breathing intervals restore neural glycogen and consolidate newly formed synapses.
        </div>
      </div>

      {/* Recent Sessions Log */}
      <div className="p-6 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-extrabold text-white">Recent Focus Logs</h2>
            <p className="text-xs text-slate-400">Past sessions stored directly in your PostgreSQL study history</p>
          </div>
          <span className="text-xs font-mono text-sky-400 font-bold">{recentSessions.length} Logged</span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No completed sessions recorded yet today. Complete your first 25-minute Pomodoro to start logging focus time!
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSessions.slice(0, 5).map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200">
                      {sess.subject?.name || 'General Focus Session'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {sess.sessionType.replace('_', ' ')} • {new Date(sess.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  +{sess.durationMinutes} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
