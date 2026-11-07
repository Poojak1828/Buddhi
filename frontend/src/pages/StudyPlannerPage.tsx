import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  Clock,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Save,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Subject, StudyPlan } from '../types/index.js';
import confetti from 'canvas-confetti';

export const StudyPlannerPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [existingPlans, setExistingPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [subjectName, setSubjectName] = useState('Physics');
  const [syllabusText, setSyllabusText] = useState(
    'Rotational Dynamics, Moment of Inertia, Rolling Motion, Angular Momentum Conservation, Electrostatics, Gauss Law'
  );
  const [examDate, setExamDate] = useState('2026-12-15');
  const [dailyHours, setDailyHours] = useState(4.0);
  const [prepLevel, setPrepLevel] = useState('Intermediate');
  const [priorityTopics, setPriorityTopics] = useState('Rotational Dynamics, Pure Rolling, Gauss Law Flux');

  // AI Generation State
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjRes, plansRes] = await Promise.all([api.getSubjects(), api.getPlans()]);
      setSubjects(subjRes.subjects);
      setExistingPlans(plansRes.plans);

      if (subjRes.subjects.length > 0) {
        setSelectedSubjectId(subjRes.subjects[0].id);
        setSubjectName(subjRes.subjects[0].name);
      }
    } catch (err) {
      console.error('Failed to load planner data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSubjectChange = (id: string) => {
    setSelectedSubjectId(id);
    const sub = subjects.find((s) => s.id === id);
    if (sub) {
      setSubjectName(sub.name);
      if (sub.examDate) {
        setExamDate(new Date(sub.examDate).toISOString().split('T')[0]);
      }
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setSaveSuccess(null);

    try {
      const res = await api.generateStudyPlan({
        subjectName,
        subjectId: selectedSubjectId || undefined,
        syllabus: syllabusText,
        examDate,
        dailyHours,
        prepLevel,
        priorityTopics,
      });

      setGeneratedDraft(res.draft);
    } catch (err: any) {
      alert(err.message || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!generatedDraft) return;

    setSavingPlan(true);
    try {
      const res = await api.saveApprovedPlan({
        title: generatedDraft.title,
        summary: generatedDraft.summary,
        schedule: generatedDraft.schedule,
        subjectId: selectedSubjectId || undefined,
        targetExamDate: examDate,
        dailyHours,
        prepLevel,
      });

      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
      });

      setSaveSuccess(
        `Plan approved! Created ${res.createdTasksCount} actionable study tasks in your database.`
      );
      // Refresh saved plans
      const plansRes = await api.getPlans();
      setExistingPlans(plansRes.plans);
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-sans animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <CalendarDays className="w-6 h-6 text-sky-400" />
            AI Adaptive Study Planner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Transform heavy examination syllabi into structured, psychologically balanced daily milestones.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Generator & Generated Plan Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Plan Configuration Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white">Study Parameters</h2>
                <p className="text-[11px] text-slate-400">Customized to your available study hours and prep level</p>
              </div>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              {/* Select or Enter Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Target Subject
                </label>
                {subjects.length > 0 ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'Curriculum'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white"
                  />
                )}
              </div>

              {/* Syllabus / Chapters Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chapters / Syllabus Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste or list your chapters, topics, or course outline..."
                  className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 font-mono leading-relaxed"
                />
              </div>

              {/* Exam Date & Daily Hours */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" /> Target Exam
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Daily Hours</span>
                    <span className="text-sky-400 font-mono font-extrabold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{dailyHours}h</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full accent-sky-500 mt-2.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Preparation Level */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Current Confidence Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPrepLevel(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold border text-center transition ${
                        prepLevel === lvl
                          ? 'border-sky-500 bg-sky-500/15 text-sky-300 shadow-sm shadow-sky-500/10'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Topics */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> High-Yield Focus Topics
                </label>
                <input
                  type="text"
                  value={priorityTopics}
                  onChange={(e) => setPriorityTopics(e.target.value)}
                  placeholder="e.g. Thermodynamics, Pure Rolling"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 disabled:opacity-50 ring-1 ring-white/20 mt-2"
              >
                {generating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    AI Synthesizing Optimal Roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Synthesize Daily Study Plan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Generated Plan View & Approval (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{saveSuccess}</span>
            </div>
          )}

          {generatedDraft ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-sky-500/40 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-wrap items-center justify-between pb-5 border-b border-slate-800/80 gap-4 relative z-10">
                <div>
                  <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    Generated Study Milestone Schedule
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">{generatedDraft.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">{generatedDraft.summary}</p>
                </div>

                <button
                  type="button"
                  disabled={savingPlan}
                  onClick={handleApproveAndSave}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingPlan ? 'Saving to Database...' : 'Approve & Activate Plan'}
                </button>
              </div>

              {/* Day-by-Day Timeline Breakdown */}
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Timeline & Active Recall Milestones
                </span>

                {generatedDraft.schedule.map((dayItem: any) => (
                  <div
                    key={dayItem.day}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-sky-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"></span>
                        {dayItem.dateLabel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-semibold">
                        {dayItem.tasks?.length || 0} Sessions
                      </span>
                    </div>

                    <div className="space-y-2.5 pl-4 border-l-2 border-sky-500/20">
                      {dayItem.tasks?.map((task: any, tIdx: number) => (
                        <div key={tIdx} className="text-xs space-y-1 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase border ${
                                  task.priority === 'HIGH'
                                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-400" />
                                {task.durationMin}m
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-slate-400 leading-normal">{task.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Plans History / Empty State */
            <div className="p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Existing Study Plans ({existingPlans.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your approved study plans already synchronized with database tasks.
                  </p>
                </div>
              </div>

              {existingPlans.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">No active plans generated yet</p>
                    <p className="text-xs text-slate-500 mt-1">Configure your syllabus on the left and synthesize your first adaptive study schedule.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {existingPlans.map((plan) => (
                    <div key={plan.id} className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 space-y-2.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{plan.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/25">
                          {plan.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{plan.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>Pacing: <strong className="text-slate-300">{plan.dailyHours} hrs / day</strong></span>
                        <span className="font-mono text-sky-400 font-bold">{plan.tasks?.length || 0} Tasks Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
