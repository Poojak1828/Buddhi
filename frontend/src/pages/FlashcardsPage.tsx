import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  X,
  Edit3,
  GraduationCap,
  FolderOpen,
  HelpCircle,
  Clock,
  Flame,
  Check,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Flashcard, Subject, Chapter, Topic } from '../types/index.js';
import { useAuth } from '../contexts/AuthContext.js';
import confetti from 'canvas-confetti';

export const FlashcardsPage: React.FC = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Array<{
    title: string;
    subjectId?: string | null;
    subjectName?: string;
    subjectColor?: string;
    chapterTitle?: string | null;
    topicTitle?: string | null;
    cardCount: number;
    masteredCount: number;
    learningCount: number;
    needsReviewCount: number;
  }>>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchy Selection State: Subject -> Chapter -> Topic -> Deck
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedChapterTitle, setSelectedChapterTitle] = useState<string>('ALL');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>('ALL');
  const [selectedDeckTitle, setSelectedDeckTitle] = useState<string>('ALL');

  // Active Recall Study Mode State
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Generator Modal State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genScope, setGenScope] = useState<'TOPIC' | 'CHAPTER' | 'SUBJECT' | 'CUSTOM'>('TOPIC');
  const [genSubjectId, setGenSubjectId] = useState('');
  const [genChapterTitle, setGenChapterTitle] = useState('');
  const [genTopic, setGenTopic] = useState('');
  const [genCustomNotes, setGenCustomNotes] = useState('');
  const [genCount, setGenCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  // Manual Creation Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSubjectId, setManualSubjectId] = useState('');
  const [manualChapterTitle, setManualChapterTitle] = useState('');
  const [manualTopicTitle, setManualTopicTitle] = useState('');
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [manualKeyConcept, setManualKeyConcept] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [savingManual, setSavingManual] = useState(false);

  // Edit Modal State
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editKeyConcept, setEditKeyConcept] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async (deckToSelectAfter?: string) => {
    try {
      setLoading(true);
      const res = await api.getFlashcards();
      setFlashcards(res.flashcards || []);
      setDecks(res.decks || []);
      setSubjects(res.subjects || []);

      if (res.subjects && res.subjects.length > 0 && !genSubjectId) {
        setGenSubjectId(res.subjects[0].id);
        setManualSubjectId(res.subjects[0].id);
        if (res.subjects[0].chapters && res.subjects[0].chapters.length > 0) {
          setGenChapterTitle(res.subjects[0].chapters[0].title);
          setManualChapterTitle(res.subjects[0].chapters[0].title);
          if (res.subjects[0].chapters[0].topics && res.subjects[0].chapters[0].topics.length > 0) {
            setGenTopic(res.subjects[0].chapters[0].topics[0].title);
            setManualTopicTitle(res.subjects[0].chapters[0].topics[0].title);
          }
        }
      }

      if (deckToSelectAfter) {
        setSelectedDeckTitle(deckToSelectAfter);
      }
    } catch (err) {
      console.error('Failed to load flashcard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update Chapter / Topic selections dynamically when genSubjectId changes
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

  useEffect(() => {
    const sub = subjects.find((s) => s.id === manualSubjectId);
    if (sub && sub.chapters && sub.chapters.length > 0) {
      setManualChapterTitle(sub.chapters[0].title);
      if (sub.chapters[0].topics && sub.chapters[0].topics.length > 0) {
        setManualTopicTitle(sub.chapters[0].topics[0].title);
      } else {
        setManualTopicTitle('');
      }
    } else {
      setManualChapterTitle('');
      setManualTopicTitle('');
    }
  }, [manualSubjectId]);

  // Handle AI Flashcard Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError('');

    let targetTopic = genTopic.trim();
    if (genScope === 'CHAPTER' && genChapterTitle) {
      targetTopic = `${genChapterTitle} Core Principles`;
    } else if (genScope === 'SUBJECT') {
      const sub = subjects.find((s) => s.id === genSubjectId);
      targetTopic = `${sub?.name || 'General'} Comprehensive Review`;
    } else if (genScope === 'CUSTOM' && !targetTopic) {
      targetTopic = 'Study Notes Deck';
    }

    if (!targetTopic) {
      setGenError('Please select or specify a topic to generate flashcards.');
      return;
    }

    setGenerating(true);
    try {
      const selectedSub = subjects.find((s) => s.id === genSubjectId);
      const res = await api.generateAIFlashcards({
        subjectId: genSubjectId || undefined,
        subjectName: selectedSub?.name || 'General',
        chapterTitle: genChapterTitle || undefined,
        topic: targetTopic,
        count: genCount,
        content: genScope === 'CUSTOM' ? genCustomNotes : undefined,
      });

      setShowGenerator(false);
      setGenTopic('');
      setGenCustomNotes('');

      // Reload and automatically select the newly created deck
      await loadData(res.deckTitle);

      // Launch study mode directly if cards are returned
      if (res.cards && res.cards.length > 0) {
        setStudyCards(res.cards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsStudyMode(true);
      }
    } catch (err: any) {
      setGenError(err.message || 'Failed to generate flashcards with AI');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Manual Flashcard Creation
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestion.trim() || !manualAnswer.trim()) return;

    setSavingManual(true);
    try {
      const sub = subjects.find((s) => s.id === manualSubjectId);
      const deckTitle = manualChapterTitle
        ? `${sub?.name || 'Curriculum'}: ${manualTopicTitle || manualChapterTitle}`
        : 'General Knowledge';

      const res = await api.createFlashcard({
        subjectId: manualSubjectId || undefined,
        chapterTitle: manualChapterTitle || undefined,
        topicTitle: manualTopicTitle || undefined,
        deckTitle,
        question: manualQuestion.trim(),
        answer: manualAnswer.trim(),
        keyConcept: manualKeyConcept.trim() || undefined,
        difficulty: manualDifficulty,
      });

      setShowManualModal(false);
      setManualQuestion('');
      setManualAnswer('');
      setManualKeyConcept('');

      await loadData(deckTitle);
    } catch (err: any) {
      alert(err.message || 'Failed to create flashcard');
    } finally {
      setSavingManual(false);
    }
  };

  // Handle Card Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editQuestion.trim() || !editAnswer.trim()) return;

    setSavingEdit(true);
    try {
      await api.updateFlashcard(editingCard.id, {
        question: editQuestion.trim(),
        answer: editAnswer.trim(),
        keyConcept: editKeyConcept.trim() || undefined,
        difficulty: editDifficulty,
      });

      setEditingCard(null);
      await loadData(selectedDeckTitle !== 'ALL' ? selectedDeckTitle : undefined);
    } catch (err: any) {
      alert(err.message || 'Failed to update flashcard');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Mastery Status Update
  const handleUpdateMastery = async (cardId: string, status: 'MASTERED' | 'LEARNING' | 'NEEDS_REVIEW') => {
    try {
      await api.updateFlashcardMastery(cardId, status);
      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, masteryStatus: status, reviewCount: c.reviewCount + 1, lastReviewed: new Date().toISOString() }
            : c
        )
      );

      if (isStudyMode) {
        if (currentIndex < studyCards.length - 1) {
          setIsFlipped(false);
          setCurrentIndex((prev) => prev + 1);
        } else {
          confetti({ particleCount: 75, spread: 70 });
          alert('🎉 Congratulations! You completed this recall session.');
          setIsStudyMode(false);
          setCurrentIndex(0);
          setIsFlipped(false);
        }
      }
    } catch (err) {
      console.error('Failed to update mastery:', err);
    }
  };

  // Handle Delete Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    try {
      await api.deleteFlashcard(cardId);
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
      setStudyCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  // Shuffle Cards in Study Mode
  const handleShuffle = () => {
    const shuffled = [...studyCards].sort(() => Math.random() - 0.5);
    setStudyCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Filter flashcards by Syllabus Hierarchy
  const filteredCards = flashcards.filter((card) => {
    if (selectedSubjectId !== 'ALL' && card.subjectId !== selectedSubjectId) return false;
    if (selectedChapterTitle !== 'ALL' && card.chapterTitle !== selectedChapterTitle) return false;
    if (selectedTopicTitle !== 'ALL' && card.topicTitle !== selectedTopicTitle) return false;
    if (selectedDeckTitle !== 'ALL' && card.deckTitle !== selectedDeckTitle) return false;
    return true;
  });

  const startActiveRecall = (cardsToStudy?: Flashcard[]) => {
    const targetCards = cardsToStudy && cardsToStudy.length > 0 ? cardsToStudy : filteredCards;
    if (targetCards.length === 0) return;
    setStudyCards(targetCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsStudyMode(true);
  };

  const currentStudyCard = studyCards[currentIndex];

  const academicLabel = user?.profile?.gradeClass || user?.profile?.academicLevel?.replace(/_/g, ' ') || 'Class 11-12';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-extrabold border border-sky-500/25 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {academicLabel}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Syllabus-Grounded Spaced Recall</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
            <Layers className="w-7 h-7 text-sky-400" />
            Active Recall Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Organised by Subject, Chapter, and Topic. Master concepts with spaced repetition and active retrieval practice.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {filteredCards.length > 0 && !isStudyMode && (
            <button
              onClick={() => startActiveRecall()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Eye className="w-4 h-4" /> Start Active Recall ({filteredCards.length})
            </button>
          )}

          <button
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700/80 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-sky-400" /> Create New Flashcard
          </button>

          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition ring-1 ring-white/10"
          >
            <Sparkles className="w-4 h-4" /> Generate with AI
          </button>
        </div>
      </div>

      {/* SYLLABUS HIERARCHY NAVIGATOR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">Syllabus Navigator</h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {filteredCards.length} Cards in View • {decks.length} Decks Total
          </span>
        </div>

        {/* Level 1: Subjects */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => {
              setSelectedSubjectId('ALL');
              setSelectedChapterTitle('ALL');
              setSelectedTopicTitle('ALL');
              setSelectedDeckTitle('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
              selectedSubjectId === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            const subCardsCount = flashcards.filter((c) => c.subjectId === sub.id).length;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedChapterTitle('ALL');
                  setSelectedTopicTitle('ALL');
                  setSelectedDeckTitle('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition border ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }}></span>
                <span>{sub.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {subCardsCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level 2: Chapters under Selected Subject */}
        {selectedSubjectId !== 'ALL' && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Chapter:</span>
            <button
              onClick={() => {
                setSelectedChapterTitle('ALL');
                setSelectedTopicTitle('ALL');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedChapterTitle === 'ALL'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Chapters
            </button>
            {subjects
              .find((s) => s.id === selectedSubjectId)
              ?.chapters?.map((chap) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    setSelectedChapterTitle(chap.title);
                    setSelectedTopicTitle('ALL');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                    selectedChapterTitle === chap.title
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  {chap.title}
                </button>
              ))}
          </div>
        )}

        {/* Level 3: Topics under Selected Chapter */}
        {selectedSubjectId !== 'ALL' && selectedChapterTitle !== 'ALL' && (
          <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Topic:</span>
            <button
              onClick={() => setSelectedTopicTitle('ALL')}
              className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                selectedTopicTitle === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Topics
            </button>
            {subjects
              .find((s) => s.id === selectedSubjectId)
              ?.chapters?.find((c) => c.title === selectedChapterTitle)
              ?.topics?.map((top) => (
                <button
                  key={top.id}
                  onClick={() => setSelectedTopicTitle(top.title)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition border ${
                    selectedTopicTitle === top.title
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  {top.title}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ACTIVE RECALL STUDY MODE */}
      {isStudyMode && currentStudyCard && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1527] border border-sky-500/40 shadow-2xl max-w-3xl mx-auto space-y-6 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Bar with Card Index, Shuffle & Exit */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-200">
                  Card <span className="text-sky-400 font-mono text-sm">{currentIndex + 1}</span> of {studyCards.length}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 truncate max-w-xs">{currentStudyCard.deckTitle}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                  title="Shuffle deck cards"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Shuffle
                </button>
                <button
                  onClick={() => setIsStudyMode(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700/60"
                >
                  Exit Recall
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((currentIndex + 1) / studyCards.length) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[260px] p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700/80 shadow-2xl flex flex-col justify-center items-center text-center cursor-pointer select-none transition-all duration-300 hover:border-sky-500/70 group"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border transition flex items-center gap-1.5">
              {isFlipped ? (
                <span className="text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                  💡 Revealed Answer (Click to Flip Back)
                </span>
              ) : (
                <span className="text-sky-400 bg-sky-500/10 border-sky-500/20">
                  ❓ Active Prompt (Click or Press Spacebar to Reveal)
                </span>
              )}
            </span>

            <p className="text-base sm:text-xl font-bold text-white leading-relaxed max-w-xl">
              {isFlipped ? currentStudyCard.answer : currentStudyCard.question}
            </p>

            {isFlipped && currentStudyCard.keyConcept && (
              <span className="mt-4 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                Core Principle: {currentStudyCard.keyConcept}
              </span>
            )}

            <span className="mt-4 text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition">
              {isFlipped ? 'Click card to review question' : 'Tap to test your recall'}
            </span>
          </div>

          {/* Controls: Prev, Mastery Assessment, Next */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev - 1);
                }
              }}
              disabled={currentIndex === 0}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
              title="Previous Card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleUpdateMastery(currentStudyCard.id, 'NEEDS_REVIEW')}
                className="px-5 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30 transition shadow-sm flex items-center gap-1.5"
              >
                Needs Revision 🔄
              </button>
              <button
                type="button"
                onClick={() => handleUpdateMastery(currentStudyCard.id, 'MASTERED')}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Mastered!
              </button>
            </div>

            <button
              onClick={() => {
                if (currentIndex < studyCards.length - 1) {
                  setIsFlipped(false);
                  setCurrentIndex((prev) => prev + 1);
                }
              }}
              disabled={currentIndex === studyCards.length - 1}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
              title="Next Card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* FLASHCARDS GRID & DECKS */}
      <div className="space-y-4">
        {/* Decks quick pill list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedDeckTitle('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedDeckTitle === 'ALL'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Decks ({flashcards.length})
          </button>
          {decks.map((deck) => (
            <button
              key={deck.title}
              onClick={() => setSelectedDeckTitle(deck.title)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                selectedDeckTitle === deck.title
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{deck.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white/90">
                {deck.cardCount}
              </span>
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-3xl shimmer-loader border border-slate-800"></div>
            ))
          ) : filteredCards.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-3xl bg-[#0D1527] border border-dashed border-slate-800 text-slate-400 space-y-4">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <p className="text-base font-bold text-slate-200">No flashcards found for this selection</p>
                <p className="text-xs text-slate-400 mt-1">
                  Generate a syllabus-grounded deck with Buddhi AI or create your own custom flashcards.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-sky-400" /> Create Manually
                </button>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-500/25"
                >
                  <Sparkles className="w-4 h-4" /> Generate Deck with AI
                </button>
              </div>
            </div>
          ) : (
            filteredCards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-3xl bg-[#0F172A]/90 border border-white/5 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
                    <span className="font-extrabold text-slate-300 truncate max-w-[170px]" title={card.deckTitle}>
                      {card.deckTitle}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                        card.masteryStatus === 'MASTERED'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : card.masteryStatus === 'NEEDS_REVIEW'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {card.masteryStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-extrabold text-white mb-2 leading-relaxed group-hover:text-sky-300 transition">
                    {card.question}
                  </h3>
                  <p className="text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 leading-relaxed font-sans">
                    {card.answer}
                  </p>

                  {card.keyConcept && (
                    <p className="mt-2 text-[10px] font-mono text-indigo-400 truncate">
                      💡 {card.keyConcept}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">Reviews: {card.reviewCount}</span>
                    <span className="text-slate-700">•</span>
                    <span className="capitalize">{card.difficulty.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCard(card);
                        setEditQuestion(card.question);
                        setEditAnswer(card.answer);
                        setEditKeyConcept(card.keyConcept || '');
                        setEditDifficulty(card.difficulty);
                      }}
                      className="text-slate-500 hover:text-sky-400 p-1 rounded transition"
                      title="Edit Card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI GENERATOR MODAL */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-sky-500/40 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                  Generate AI Flashcards from Syllabus
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Buddhi extracts high-yield active-recall question-and-answer pairs directly grounded in your curriculum.
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

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Generation Scope Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Generation Source</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['TOPIC', 'CHAPTER', 'SUBJECT', 'CUSTOM'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setGenScope(s)}
                      className={`py-2 px-2 rounded-xl font-bold transition text-center border ${
                        genScope === s
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                      }`}
                    >
                      {s === 'TOPIC' ? 'Topic' : s === 'CHAPTER' ? 'Chapter' : s === 'SUBJECT' ? 'Subject' : 'Notes/Text'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject Curriculum</label>
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

              {/* Chapter Dropdown */}
              {genScope !== 'SUBJECT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Chapter</label>
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
              )}

              {/* Topic Input or Dropdown */}
              {genScope === 'TOPIC' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Topic / Concept</label>
                  <input
                    type="text"
                    required
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder="e.g. Center of Mass & Rigid Body Equilibrium"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500"
                  />
                </div>
              )}

              {/* Custom Notes Area */}
              {genScope === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Paste Study Notes or Material
                  </label>
                  <textarea
                    rows={4}
                    value={genCustomNotes}
                    onChange={(e) => setGenCustomNotes(e.target.value)}
                    placeholder="Paste lecture notes, textbook summaries, or formulas here to convert them into recall flashcards..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 resize-none font-sans"
                  />
                </div>
              )}

              {/* Deck Size */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Number of Cards</label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:border-sky-500 font-bold"
                >
                  <option value={6}>6 High-Yield Flashcards (Recommended)</option>
                  <option value={8}>8 Comprehensive Flashcards</option>
                  <option value={10}>10 In-Depth Flashcards</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 disabled:opacity-50 ring-1 ring-white/20"
                >
                  {generating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" /> Synthesizing Cards from Syllabus...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Synthesize & Save to PostgreSQL
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MANUAL FLASHCARD MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-3xl bg-[#0D1527] border border-slate-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-400" />
                  Create New Flashcard
                </h2>
                <p className="text-xs text-slate-400">Save a custom active-recall card into your deck library.</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject</label>
                  <select
                    value={manualSubjectId}
                    onChange={(e) => setManualSubjectId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Difficulty</label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Chapter Title (Optional)</label>
                <input
                  type="text"
                  value={manualChapterTitle}
                  onChange={(e) => setManualChapterTitle(e.target.value)}
                  placeholder="e.g. Rotational Mechanics"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Question / Active Prompt *</label>
                <textarea
                  rows={2}
                  required
                  value={manualQuestion}
                  onChange={(e) => setManualQuestion(e.target.value)}
                  placeholder="State the question or prompt..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Answer / Model Solution *</label>
                <textarea
                  rows={3}
                  required
                  value={manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  placeholder="Enter the concise, clear answer..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Key Principle / Formula Hint</label>
                <input
                  type="text"
                  value={manualKeyConcept}
                  onChange={(e) => setManualKeyConcept(e.target.value)}
                  placeholder="e.g. Parallel Axis Theorem: I = I_cm + Md^2"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingManual}
                  className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {savingManual ? 'Saving Card...' : 'Save Flashcard to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLASHCARD MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0D1527] border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                Edit Flashcard
              </h2>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Question</label>
                <textarea
                  rows={2}
                  required
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Answer</label>
                <textarea
                  rows={3}
                  required
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Key Principle</label>
                <input
                  type="text"
                  value={editKeyConcept}
                  onChange={(e) => setEditKeyConcept(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition"
                >
                  {savingEdit ? 'Updating Card...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
