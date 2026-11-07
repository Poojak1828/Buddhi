import React, { useState } from 'react';
import {
  Settings,
  User,
  GraduationCap,
  Clock,
  Target,
  Save,
  CheckCircle2,
  LogOut,
  Heart,
  RefreshCw,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import { api } from '../services/api.js';

const CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const STREAMS = [
  { id: 'Science (PCM)', label: 'Science (PCM)', desc: 'Physics, Chemistry, Math' },
  { id: 'Science (PCB)', label: 'Science (PCB)', desc: 'Physics, Chemistry, Biology' },
  { id: 'Commerce', label: 'Commerce', desc: 'Accountancy, Business Studies, Economics' },
  { id: 'Arts', label: 'Arts / Humanities', desc: 'History, Political Science, Geography' },
];

const BOARDS = [
  { id: 'CBSE', label: 'CBSE', desc: 'Central Board of Secondary Education' },
  { id: 'ICSE', label: 'ICSE / ISC', desc: 'Council for the Indian School Certificate' },
  { id: 'State Board', label: 'State Board', desc: 'State Curriculum Board' },
];

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [gradeClass, setGradeClass] = useState(user?.profile?.gradeClass || 'Class 12');
  const [board, setBoard] = useState(user?.profile?.board || 'CBSE');
  const [stream, setStream] = useState(user?.profile?.stream || 'Science (PCM)');
  const [targetExams, setTargetExams] = useState(user?.profile?.targetExams || '');
  const [dailyHours, setDailyHours] = useState(user?.profile?.dailyAvailableHours || 4.5);
  const [preferredSchedule, setPreferredSchedule] = useState(user?.profile?.preferredSchedule || 'EVENING');
  const [studyGoals, setStudyGoals] = useState(user?.profile?.studyGoals || '');
  const [stressNotes, setStressNotes] = useState(user?.profile?.stressLevelNotes || '');

  const [saving, setSaving] = useState(false);
  const [syncingCurriculum, setSyncingCurriculum] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const isSeniorClass = gradeClass === 'Class 11' || gradeClass === 'Class 12';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const academicLevel = isSeniorClass ? 'SENIOR_SECONDARY_PREP' : 'SCHOOL_SECONDARY';
      const courseOrDegree = isSeniorClass ? `${gradeClass} ${stream} (${board})` : `${gradeClass} (${board})`;

      await updateProfile({
        name,
        academicLevel,
        gradeClass,
        board,
        stream: isSeniorClass ? stream : undefined,
        courseOrDegree,
        targetExams,
        dailyAvailableHours: dailyHours,
        preferredSchedule,
        studyGoals,
        stressLevelNotes: stressNotes,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncCurriculum = async () => {
    setSyncingCurriculum(true);
    setSyncSuccessMsg('');
    try {
      const res = await api.autoPopulateCurriculum({
        gradeClass,
        board,
        stream: isSeniorClass ? stream : undefined,
        targetExams,
      });
      setSyncSuccessMsg(res.message || 'Syllabus and high-yield flashcards synchronized!');
      setTimeout(() => setSyncSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(`Error synchronizing syllabus: ${err.message}`);
    } finally {
      setSyncingCurriculum(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-sky-400" />
            Profile & Learning Preferences
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize your academic pacing, board curriculum, exam deadlines, and psychological guidance.
          </p>
        </div>

        <button
          type="button"
          disabled={syncingCurriculum}
          onClick={handleSyncCurriculum}
          className="px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncingCurriculum ? 'animate-spin' : ''}`} />
          {syncingCurriculum ? 'Syncing...' : 'Sync Standard Syllabus'}
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Profile preferences saved and synchronized!</span>
        </div>
      )}

      {syncSuccessMsg && (
        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-400" /> Student Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-sky-400" /> Class / Standard
            </label>
            <select
              value={gradeClass}
              onChange={(e) => setGradeClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Conditional Stream Selection: Only for Class 11 & 12 */}
          {isSeniorClass && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-sky-400 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" /> Stream (Class 11 & 12 Only)
              </label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-sky-500/40 text-xs text-white"
              >
                {STREAMS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} ({s.desc})</option>
                ))}
              </select>
            </div>
          )}

          {/* Board Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-sky-400" /> Educational Board
            </label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              {BOARDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label} - {b.desc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Examinations</label>
            <input
              type="text"
              value={targetExams}
              onChange={(e) => setTargetExams(e.target.value)}
              placeholder="e.g. CBSE Boards 2026 / JEE Main 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" /> Daily Available Study Time
              </span>
              <span className="text-sky-400 font-bold">{dailyHours} Hours</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={dailyHours}
              onChange={(e) => setDailyHours(parseFloat(e.target.value))}
              className="w-full accent-sky-500 mt-2 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Routine</label>
            <select
              value={preferredSchedule}
              onChange={(e) => setPreferredSchedule(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              <option value="MORNING">Morning Focus (6 AM - 12 PM)</option>
              <option value="AFTERNOON">Afternoon Focus (12 PM - 5 PM)</option>
              <option value="EVENING">Evening Focus (5 PM - 10 PM)</option>
              <option value="NIGHT">Night Owl Routine (10 PM - 2 AM)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" /> Academic Goals
          </label>
          <textarea
            rows={2}
            value={studyGoals}
            onChange={(e) => setStudyGoals(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-400" /> Psychological Well-being Notes
          </label>
          <input
            type="text"
            value={stressNotes}
            onChange={(e) => setStressNotes(e.target.value)}
            placeholder="e.g. Need calm encouragement when falling behind, avoid harsh deadlines"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition flex items-center gap-2 shadow"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
