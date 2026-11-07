import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Sparkles,
  Layers,
  Save,
  Pin,
  Tag,
  Upload,
  ExternalLink,
  X,
  FileUp,
  Link as LinkIcon,
  HardDrive,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Note, Subject } from '../types/index.js';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<string>('');
  const [editTags, setEditTags] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editFileName, setEditFileName] = useState<string | null>(null);
  const [editFileUrl, setEditFileUrl] = useState<string | null>(null);
  const [editFileType, setEditFileType] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [flashcardResult, setFlashcardResult] = useState<string | null>(null);

  // Drive Import Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [driveDocTitle, setDriveDocTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesRes, subjectsRes] = await Promise.all([
        api.getNotes({
          search: searchQuery || undefined,
          subjectId: selectedSubjectId || undefined,
        }),
        api.getSubjects(),
      ]);

      setNotes(notesRes.notes);
      setSubjects(subjectsRes.subjects);

      if (notesRes.notes.length > 0 && !selectedNote) {
        selectNoteForEditing(notesRes.notes[0]);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedSubjectId]);

  const selectNoteForEditing = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubjectId(note.subjectId || '');
    setEditTags(note.tags || '');
    setEditIsPinned(note.isPinned);
    setEditFileName(note.fileName || null);
    setEditFileUrl(note.fileUrl || null);
    setEditFileType(note.fileType || null);
    setSummaryResult(null);
    setFlashcardResult(null);
  };

  const handleCreateNewNote = async () => {
    try {
      const res = await api.createNote({
        title: 'Untitled Study Note',
        content: '# Concept Notes\n\nCapture key formulas, definitions, and questions here...',
        subjectId: subjects.length > 0 ? subjects[0].id : undefined,
      });

      const updatedNotesRes = await api.getNotes();
      setNotes(updatedNotesRes.notes);
      selectNoteForEditing(res.note);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // 1. File Upload from Local System
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'txt';
    const isTextFile = ['txt', 'md', 'json', 'csv', 'py', 'js', 'html'].includes(fileExt);

    const reader = new FileReader();

    if (isTextFile) {
      reader.onload = async (event) => {
        const textContent = (event.target?.result as string) || '';
        try {
          const res = await api.createNote({
            title: fileName.replace(/\.[^/.]+$/, ''),
            content: `# ${fileName}\n\n${textContent}`,
            subjectId: editSubjectId || (subjects.length > 0 ? subjects[0].id : undefined),
            fileName,
            fileType: fileExt,
          });
          const updatedNotesRes = await api.getNotes();
          setNotes(updatedNotesRes.notes);
          selectNoteForEditing(res.note);
        } catch (err) {
          console.error('Failed to create note from file:', err);
        }
      };
      reader.readAsText(file);
    } else {
      // PDF or binary file: read as data URL so user can view/download
      reader.onload = async (event) => {
        const dataUrl = (event.target?.result as string) || '';
        try {
          const res = await api.createNote({
            title: fileName.replace(/\.[^/.]+$/, ''),
            content: `# ${fileName}\n\n*Uploaded file from system (${fileExt.toUpperCase()} - ${(file.size / 1024).toFixed(1)} KB)*\n\nAdd your reading notes and highlights below:`,
            subjectId: editSubjectId || (subjects.length > 0 ? subjects[0].id : undefined),
            fileName,
            fileUrl: dataUrl,
            fileType: fileExt,
          });
          const updatedNotesRes = await api.getNotes();
          setNotes(updatedNotesRes.notes);
          selectNoteForEditing(res.note);
        } catch (err) {
          console.error('Failed to upload file note:', err);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Import from Google Drive
  const handleDriveImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    try {
      const title = driveDocTitle.trim() || 'Google Drive Document';
      const res = await api.createNote({
        title,
        content: `# ${title}\n\n🔗 **Google Drive Resource:** [Open in Google Drive](${driveUrl})\n\n### Study Summary & Lecture Takeaways:\n- `,
        subjectId: editSubjectId || (subjects.length > 0 ? subjects[0].id : undefined),
        fileName: title,
        fileUrl: driveUrl,
        fileType: 'google-drive',
      });

      setShowDriveModal(false);
      setDriveUrl('');
      setDriveDocTitle('');

      const updatedNotesRes = await api.getNotes();
      setNotes(updatedNotesRes.notes);
      selectNoteForEditing(res.note);
    } catch (err) {
      alert('Failed to import Drive resource');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setIsSaving(true);
    try {
      const res = await api.updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent,
        subjectId: editSubjectId || undefined,
        tags: editTags,
        isPinned: editIsPinned,
        fileName: editFileName || undefined,
        fileUrl: editFileUrl || undefined,
        fileType: editFileType || undefined,
      });

      setSelectedNote(res.note);
      setNotes((prev) => prev.map((n) => (n.id === res.note.id ? res.note : n)));
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (remaining.length > 0) {
        selectNoteForEditing(remaining[0]);
      } else {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleSummarize = async () => {
    if (!selectedNote) return;
    try {
      const res = await api.summarizeNote(selectedNote.id);
      setSummaryResult(res.summary);
    } catch (err) {
      alert('Failed to summarize note');
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedNote) return;
    try {
      const res = await api.generateFlashcardsFromNote(selectedNote.id);
      setFlashcardResult(res.message);
    } catch (err) {
      alert('Failed to generate flashcards');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans animate-fade-in">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt,.docx,.doc,.md,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <FileText className="w-6 h-6 text-sky-400" />
            Notes & Concept Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capture academic insights, upload system documents, link Google Drive notes, and synthesize AI summaries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Upload from Computer */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-sky-400" /> Upload File
          </button>

          {/* Import from Google Drive */}
          <button
            onClick={() => setShowDriveModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <HardDrive className="w-4 h-4 text-emerald-400" /> Import from Drive
          </button>

          {/* New Note */}
          <button
            onClick={handleCreateNewNote}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition ring-1 ring-white/10"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>
      </div>

      {/* Google Drive Import Modal */}
      {showDriveModal && (
        <div className="p-6 rounded-3xl bg-[#0F172A] border border-sky-500/30 shadow-2xl space-y-4 max-w-lg mx-auto animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Import from Google Drive</h3>
            </div>
            <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleDriveImport} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Document / Topic Title</label>
              <input
                type="text"
                required
                value={driveDocTitle}
                onChange={(e) => setDriveDocTitle(e.target.value)}
                placeholder="e.g. Thermodynamics Lecture Slides"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Google Drive Sharing URL</label>
              <input
                type="url"
                required
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Import Drive Document into Buddhi
            </button>
          </form>
        </div>
      )}

      {/* Main Grid: Notes Sidebar (4 cols) & Markdown Note Editor (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)]">
        {/* Left: Notes Explorer & Search */}
        <div className="lg:col-span-4 flex flex-col rounded-3xl bg-[#0F172A]/90 border border-white/5 overflow-hidden shadow-2xl">
          {/* Search & Subject Filter Bar */}
          <div className="p-4 border-b border-slate-800/80 space-y-2.5 bg-slate-900/40">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, files, or tags..."
                className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 font-medium"
              />
            </div>
            {subjects.length > 0 && (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 font-semibold focus:border-sky-500"
              >
                <option value="">All Subjects ({notes.length} notes)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {notes.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No study notes match your query.</p>
              </div>
            ) : (
              notes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                const hasAttachment = Boolean(note.fileName || note.fileUrl);

                return (
                  <div
                    key={note.id}
                    onClick={() => selectNoteForEditing(note)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 text-left relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900/90 border-sky-500/60 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/20'
                        : 'border-transparent bg-slate-900/30 hover:bg-slate-900/70 hover:border-slate-800 text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 inset-y-0 w-1 bg-sky-400"></div>
                    )}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white truncate max-w-[180px] group-hover:text-sky-300 transition">
                        {note.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasAttachment && (
                          <span className="p-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20" title="File Attached">
                            <FileUp className="w-3 h-3" />
                          </span>
                        )}
                        {note.isPinned && (
                          <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Pin className="w-3 h-3 fill-amber-400" />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                      {note.content.replace(/[#*`$]/g, '')}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-500">
                      {note.subject ? (
                        <span
                          className="font-bold px-2 py-0.5 rounded-full text-[9px] border"
                          style={{
                            backgroundColor: `${note.subject.color}15`,
                            borderColor: `${note.subject.color}30`,
                            color: note.subject.color,
                          }}
                        >
                          {note.subject.name}
                        </span>
                      ) : (
                        <span className="text-slate-600">General</span>
                      )}
                      <span className="font-mono">{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Rich Editor & AI Tooling */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl bg-[#0F172A]/90 border border-white/5 overflow-hidden shadow-2xl">
          {selectedNote ? (
            <>
              {/* Note Editor Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title"
                  className="flex-1 min-w-[200px] text-base font-extrabold bg-transparent border-none text-white focus:outline-none placeholder-slate-600"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditIsPinned(!editIsPinned)}
                    className={`p-2 rounded-xl transition border ${
                      editIsPinned
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title="Pin Note to Top"
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSummarize}
                    className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Summarize</span>
                  </button>

                  <button
                    onClick={handleGenerateFlashcards}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Make Flashcards</span>
                  </button>

                  <button
                    onClick={handleSaveNote}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition shadow-md shadow-sky-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? 'Saving...' : 'Save Note'}
                  </button>

                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Attached File or Google Drive Badge (If Present) */}
              {(editFileName || editFileUrl) && (
                <div className="px-5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
                  <div className="flex items-center gap-2">
                    {editFileType === 'google-drive' ? (
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileUp className="w-4 h-4 text-sky-400" />
                    )}
                    <span>
                      Attached: <strong className="text-white">{editFileName || 'Linked File'}</strong>
                      {editFileType && <span className="ml-1.5 uppercase font-mono text-[10px] text-slate-400">({editFileType})</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {editFileUrl && (
                      <a
                        href={editFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <ExternalLink className="w-3 h-3" /> Open File
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setEditFileName(null);
                        setEditFileUrl(null);
                        setEditFileType(null);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1"
                      title="Detach file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Subject Tag Selector Bar */}
              <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-4 text-xs shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">Subject:</span>
                  <select
                    value={editSubjectId}
                    onChange={(e) => setEditSubjectId(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:border-sky-500"
                  >
                    <option value="">General (No subject)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (e.g. physics, derivation, exam-2026)"
                    className="w-full bg-transparent border-none text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                <span className="text-[10px] text-slate-500 font-mono">
                  {editContent.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {/* AI Summary / Flashcards notification popups */}
              {summaryResult && (
                <div className="p-4 mx-5 mt-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-slate-200 space-y-2 shrink-0 animate-fade-in shadow-xl">
                  <div className="flex items-center justify-between font-extrabold text-indigo-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      AI Conceptual Summary
                    </span>
                    <button onClick={() => setSummaryResult(null)} className="text-slate-400 hover:text-white p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-300 font-sans">{summaryResult}</div>
                </div>
              )}

              {flashcardResult && (
                <div className="p-3.5 mx-5 mt-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between shrink-0 animate-fade-in shadow-lg">
                  <span className="font-semibold">{flashcardResult}</span>
                  <button onClick={() => setFlashcardResult(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Textarea for Markdown editing */}
              <div className="flex-1 p-5 bg-[#080C14]/40">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Capture concepts, formulas, and insights using Markdown..."
                  className="w-full h-full bg-transparent border-none text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none font-mono leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">Select or create a study note</p>
              <p className="text-xs text-slate-600">Choose from your list on the left or upload a file from your computer or Google Drive.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
