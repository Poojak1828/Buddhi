import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Circle,
  Sparkles,
  Edit2,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Subject, Chapter, Topic } from '../types/index.js';

export const SubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingCurriculum, setSyncingCurriculum] = useState(false);

  // New Subject Modal / Form
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubColor, setNewSubColor] = useState('#38BDF8');
  const [newSubExamDate, setNewSubExamDate] = useState('');
  const [newSubTarget, setNewSubTarget] = useState(90);

  // New Chapter Form
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // New Topic Form
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicChapterId, setNewTopicChapterId] = useState<string | null>(null);
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects();
      setSubjects(res.subjects);
      if (res.subjects.length > 0) {
        // If nothing selected or previously selected doesn't exist, select first
        const found = res.subjects.find((s) => s.id === selectedSubject?.id) || res.subjects[0];
        const detailRes = await api.getSubjectById(found.id);
        setSelectedSubject(detailRes.subject);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSelectSubject = async (sub: Subject) => {
    try {
      const detailRes = await api.getSubjectById(sub.id);
      setSelectedSubject(detailRes.subject);
    } catch (err) {
      console.error('Failed to get subject details:', err);
    }
  };

  const handleSyncCurriculum = async () => {
    setSyncingCurriculum(true);
    try {
      const gradeClass = user?.profile?.gradeClass || 'Class 12';
      const board = user?.profile?.board || 'CBSE';
      const stream = user?.profile?.stream || 'Science (PCM)';
      const targetExams = user?.profile?.targetExams;

      await api.autoPopulateCurriculum({ gradeClass, board, stream, targetExams });
      await loadSubjects();
    } catch (err: any) {
      alert(`Failed to sync curriculum: ${err.message}`);
    } finally {
      setSyncingCurriculum(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    try {
      const res = await api.createSubject({
        name: newSubName,
        code: newSubCode || undefined,
        color: newSubColor,
        examDate: newSubExamDate || undefined,
        targetScore: newSubTarget,
      });

      setShowAddSubject(false);
      setNewSubName('');
      setNewSubCode('');
      setNewSubExamDate('');
      await loadSubjects();
      handleSelectSubject(res.subject);
    } catch (err) {
      console.error('Failed to create subject:', err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject and its entire syllabus?')) return;
    try {
      await api.deleteSubject(id);
      await loadSubjects();
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newChapterTitle.trim()) return;

    try {
      await api.createChapter(selectedSubject.id, newChapterTitle);
      setNewChapterTitle('');
      setShowAddChapter(false);
      handleSelectSubject(selectedSubject);
    } catch (err) {
      console.error('Failed to create chapter:', err);
    }
  };

  const handleCreateTopic = async (chapterId: string) => {
    if (!newTopicTitle.trim()) return;
    try {
      await api.createTopic(chapterId, newTopicTitle, newTopicDifficulty);
      setNewTopicTitle('');
      setNewTopicChapterId(null);
      if (selectedSubject) handleSelectSubject(selectedSubject);
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const handleToggleTopicStatus = async (topicId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    try {
      await api.updateTopic(topicId, { status: nextStatus });
      if (selectedSubject) {
        handleSelectSubject(selectedSubject);
        // Refresh subjects list for completion % update
        const res = await api.getSubjects();
        setSubjects(res.subjects);
      }
    } catch (err) {
      console.error('Failed to update topic status:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await api.deleteTopic(topicId);
      if (selectedSubject) handleSelectSubject(selectedSubject);
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <BookOpen className="w-6 h-6 text-sky-400" />
            Subjects & Syllabus Architecture
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Structured curriculum tracker with topic-level mastery status, difficulty ratings, and target exam timelines.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncCurriculum}
            disabled={syncingCurriculum}
            className="px-3.5 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold flex items-center gap-2 transition shadow-sm"
            title="Auto-populate standard board chapters and topics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingCurriculum ? 'animate-spin' : ''}`} />
            {syncingCurriculum ? 'Syncing...' : 'Sync Board Syllabus'}
          </button>
          <button
            onClick={() => setShowAddSubject(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition ring-1 ring-white/10"
          >
            <Plus className="w-4 h-4" /> Add New Subject
          </button>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-sky-500/40 shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white">Add New Academic Subject</h2>
              <p className="text-xs text-slate-400">Configure curriculum details, color theme, and target exam deadlines.</p>
            </div>
            <button
              onClick={() => setShowAddSubject(false)}
              className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject Name *</label>
              <input
                type="text"
                required
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="e.g. Organic Chemistry"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Curriculum Code / Abbreviation</label>
              <input
                type="text"
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value)}
                placeholder="e.g. CHEM-201"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Examination Date</label>
              <input
                type="date"
                value={newSubExamDate}
                onChange={(e) => setNewSubExamDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Accent Theme Color</label>
              <div className="flex items-center gap-2.5">
                {['#38BDF8', '#34D399', '#818CF8', '#F59E0B', '#EC4899', '#A855F7'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewSubColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-xl transition-all ${
                      newSubColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                    }`}
                  ></button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Score (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={newSubTarget}
                onChange={(e) => setNewSubTarget(parseInt(e.target.value, 10))}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Layout: Subjects Tabs + Detailed Syllabus Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Subject List / Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Your Subjects</span>
            <span className="text-xs text-slate-500 font-mono font-bold">{subjects.length} Total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl shimmer-loader border border-slate-800"></div>
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-400 space-y-3">
              <p>No subjects added yet.</p>
              <button
                onClick={() => setShowAddSubject(true)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
              >
                + Create Subject
              </button>
            </div>
          ) : (
            subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubject(sub)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500/70 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/20'
                      : 'bg-[#0F172A]/80 border-white/5 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Color Accent Indicator Strip */}
                  <div
                    className="absolute top-0 inset-x-0 h-1 transition-all"
                    style={{ backgroundColor: sub.color }}
                  ></div>

                  <div className="flex items-center justify-between mb-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                      <span className="font-bold text-xs text-white group-hover:text-sky-300 transition">
                        {sub.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-extrabold" style={{ color: sub.color }}>
                      {sub.syllabusCompletion}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sub.syllabusCompletion}%`, backgroundColor: sub.color }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                      {sub.code || 'Curriculum'}
                    </span>
                    <span>
                      {sub.examDate
                        ? `📅 ${new Date(sub.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        : 'No exam date'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Syllabus View (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSubject ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-[#0F172A]/90 border border-white/5 shadow-2xl space-y-6">
              {/* Subject Banner */}
              <div className="flex flex-wrap items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ring-1 ring-white/20"
                    style={{ backgroundColor: selectedSubject.color }}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2.5">
                      {selectedSubject.name}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {selectedSubject.code || 'CORE'}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Syllabus Mastery: <span className="font-extrabold text-white">{selectedSubject.syllabusCompletion}%</span> • Target Score: <span className="text-emerald-400 font-bold">{selectedSubject.targetScore}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddChapter(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700/80 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4 text-sky-400" /> Add Chapter
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(selectedSubject.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add Chapter Form Inline */}
              {showAddChapter && (
                <form
                  onSubmit={handleCreateChapter}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/40 flex items-center gap-3 shadow-lg animate-fade-in"
                >
                  <input
                    type="text"
                    required
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Chapter Title (e.g. Chapter 4: Rotational Mechanics & Rigid Bodies)"
                    className="flex-1 h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-sm"
                  >
                    Save Chapter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Chapters & Topics List */}
              <div className="space-y-5">
                {(selectedSubject.chapters || []).length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">No chapters added yet for {selectedSubject.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Divide your syllabus into chapters and topics to track completion.</p>
                    </div>
                    <button
                      onClick={() => setShowAddChapter(true)}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add First Chapter
                    </button>
                  </div>
                ) : (
                  selectedSubject.chapters?.map((chapter, cIdx) => (
                    <div key={chapter.id} className="p-5 rounded-2xl bg-slate-900/70 border border-white/5 space-y-3.5 shadow-sm hover:border-slate-800 transition">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-bold flex items-center justify-center">
                            {cIdx + 1}
                          </span>
                          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                            {chapter.title}
                          </h3>
                        </div>
                        <button
                          onClick={() => setNewTopicChapterId(newTopicChapterId === chapter.id ? null : chapter.id)}
                          className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Topic
                        </button>
                      </div>

                      {/* Add Topic Inline Row */}
                      {newTopicChapterId === chapter.id && (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 flex items-center gap-2 flex-wrap animate-fade-in shadow-inner">
                          <input
                            type="text"
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            placeholder="Topic title (e.g. Rolling Motion Without Slipping)"
                            className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500"
                          />
                          <select
                            value={newTopicDifficulty}
                            onChange={(e) => setNewTopicDifficulty(e.target.value as any)}
                            className="h-9 px-3 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-300 font-semibold"
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleCreateTopic(chapter.id)}
                            className="h-9 px-4 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-sm"
                          >
                            Add Topic
                          </button>
                        </div>
                      )}

                      {/* Topics Table/List */}
                      <div className="space-y-2 pt-1">
                        {chapter.topics.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-1">No topics added in this chapter yet.</p>
                        ) : (
                          chapter.topics.map((t) => (
                            <div
                              key={t.id}
                              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                                t.status === 'COMPLETED'
                                  ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleTopicStatus(t.id, t.status)}
                                className="flex items-center gap-3 cursor-pointer flex-1 group"
                              >
                                {t.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-sky-400 transition" />
                                )}
                                <span className={`font-medium ${t.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'}`}>
                                  {t.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${
                                    t.difficulty === 'HARD'
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                      : t.difficulty === 'MEDIUM'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  }`}
                                >
                                  {t.difficulty}
                                </span>
                                <button
                                  onClick={() => handleDeleteTopic(t.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                                  title="Delete Topic"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 rounded-3xl bg-[#0F172A]/50 border border-slate-800">
              Please select or create an academic subject to view syllabus architecture.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
