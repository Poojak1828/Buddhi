import { Response } from 'express';
import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getFlashcards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectId, chapterTitle, topicTitle, deckTitle } = req.query;

    let whereClause: any = { userId };
    if (subjectId) {
      whereClause.subjectId = String(subjectId);
    }
    if (deckTitle) {
      whereClause.deckTitle = String(deckTitle);
    }
    if (chapterTitle) {
      whereClause.chapterTitle = String(chapterTitle);
    }
    if (topicTitle) {
      whereClause.topicTitle = String(topicTitle);
    }

    const [flashcards, subjects] = await Promise.all([
      prisma.flashcard.findMany({
        where: whereClause,
        include: {
          subject: { select: { id: true, name: true, color: true, icon: true } },
        },
        orderBy: [{ masteryStatus: 'asc' }, { updatedAt: 'desc' }],
      }),
      prisma.subject.findMany({
        where: { userId },
        include: {
          chapters: {
            include: {
              topics: { orderBy: { orderIndex: 'asc' } },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Group decks with rich statistics for syllabus navigation
    const decksMap: {
      [key: string]: {
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
      };
    } = {};

    flashcards.forEach((f) => {
      const deckKey = f.deckTitle || 'General Deck';
      if (!decksMap[deckKey]) {
        decksMap[deckKey] = {
          title: deckKey,
          subjectId: f.subjectId,
          subjectName: f.subject?.name,
          subjectColor: f.subject?.color,
          chapterTitle: f.chapterTitle,
          topicTitle: f.topicTitle,
          cardCount: 0,
          masteredCount: 0,
          learningCount: 0,
          needsReviewCount: 0,
        };
      }
      decksMap[deckKey].cardCount += 1;
      if (f.masteryStatus === 'MASTERED') decksMap[deckKey].masteredCount += 1;
      else if (f.masteryStatus === 'NEEDS_REVIEW') decksMap[deckKey].needsReviewCount += 1;
      else decksMap[deckKey].learningCount += 1;
    });

    res.json({
      flashcards,
      decks: Object.values(decksMap),
      subjects,
    });
  } catch (error) {
    console.error('[Get Flashcards Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve flashcards.' });
  }
};

export const generateAIFlashcards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectId, subjectName, chapterTitle, topic, count, content } = req.body;

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Topic is required for flashcard generation.' });
      return;
    }

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const academicLevel = userProfile?.academicLevel || 'Curriculum';

    // Retrieve syllabus context if available
    let resolvedSubjectName = subjectName;
    let resolvedChapterTitle = chapterTitle;
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId },
        include: { chapters: { include: { topics: true } } },
      });
      if (subject) {
        resolvedSubjectName = subject.name;
        if (!resolvedChapterTitle && subject.chapters.length > 0) {
          const matchedChapter = subject.chapters.find((ch) =>
            ch.topics.some((tp) => tp.title.toLowerCase() === topic.toLowerCase())
          );
          if (matchedChapter) resolvedChapterTitle = matchedChapter.title;
        }
      }
    }

    const deckTitle = resolvedChapterTitle
      ? `${resolvedSubjectName || 'Study'}: ${topic}`
      : `${topic} Deck`;

    const generatedCards = await aiService.generateFlashcards({
      subjectName: resolvedSubjectName || 'Curriculum',
      chapterTitle: resolvedChapterTitle,
      topic: topic.trim(),
      count: count ? Math.min(15, Math.max(4, parseInt(count, 10))) : 6,
      content,
      academicLevel,
    });

    // Save cards into PostgreSQL
    const createdCards: any[] = [];
    for (const c of generatedCards) {
      const card = await prisma.flashcard.create({
        data: {
          userId,
          subjectId: subjectId || null,
          deckTitle,
          chapterTitle: resolvedChapterTitle || null,
          topicTitle: topic.trim(),
          question: c.question,
          answer: c.answer,
          keyConcept: c.keyConcept || `${topic.trim()} Key Principle`,
          difficulty: (c.difficulty as any) || 'MEDIUM',
          masteryStatus: 'LEARNING',
        },
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
      });
      createdCards.push(card);
    }

    res.status(201).json({
      count: createdCards.length,
      deckTitle,
      cards: createdCards,
      message: `Successfully generated and saved ${createdCards.length} flashcards for ${topic}!`,
    });
  } catch (error: any) {
    console.error('[Generate Flashcards Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
};

export const createFlashcard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { deckTitle, chapterTitle, topicTitle, question, answer, keyConcept, subjectId, difficulty } = req.body;

    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required.' });
      return;
    }

    const card = await prisma.flashcard.create({
      data: {
        userId,
        deckTitle: deckTitle || 'General Knowledge',
        chapterTitle: chapterTitle || null,
        topicTitle: topicTitle || null,
        question: question.trim(),
        answer: answer.trim(),
        keyConcept: keyConcept?.trim() || null,
        subjectId: subjectId || null,
        difficulty: difficulty || 'MEDIUM',
        masteryStatus: 'LEARNING',
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.status(201).json({ card, message: 'Flashcard created successfully' });
  } catch (error) {
    console.error('[Create Flashcard Error]:', error);
    res.status(500).json({ error: 'Failed to create flashcard.' });
  }
};

export const updateFlashcard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const { question, answer, keyConcept, difficulty, deckTitle, chapterTitle, topicTitle } = req.body;

    const card = await prisma.flashcard.findFirst({ where: { id, userId } });
    if (!card) {
      res.status(404).json({ error: 'Flashcard not found or unauthorized.' });
      return;
    }

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        question: question !== undefined ? question.trim() : card.question,
        answer: answer !== undefined ? answer.trim() : card.answer,
        keyConcept: keyConcept !== undefined ? keyConcept?.trim() : card.keyConcept,
        difficulty: difficulty !== undefined ? difficulty : card.difficulty,
        deckTitle: deckTitle !== undefined ? deckTitle.trim() : card.deckTitle,
        chapterTitle: chapterTitle !== undefined ? chapterTitle : card.chapterTitle,
        topicTitle: topicTitle !== undefined ? topicTitle : card.topicTitle,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.json({ card: updated, message: 'Flashcard updated successfully.' });
  } catch (error) {
    console.error('[Update Flashcard Error]:', error);
    res.status(500).json({ error: 'Failed to update flashcard.' });
  }
};

export const updateMastery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const statusInput = req.body.masteryStatus || req.body.status;
    const card = await prisma.flashcard.findFirst({ where: { id, userId } });
    if (!card) {
      res.status(404).json({ error: 'Flashcard not found or unauthorized.' });
      return;
    }

    const validStatus = ['MASTERED', 'LEARNING', 'NEEDS_REVIEW'].includes(statusInput)
      ? statusInput
      : 'LEARNING';

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        masteryStatus: validStatus,
        reviewCount: card.reviewCount + 1,
        lastReviewed: new Date(),
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.json({ card: updated, message: `Mastery status updated to ${validStatus}` });
  } catch (error) {
    console.error('[Update Mastery Error]:', error);
    res.status(500).json({ error: 'Failed to update flashcard mastery.' });
  }
};

export const deleteFlashcard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const card = await prisma.flashcard.findFirst({ where: { id, userId } });
    if (!card) {
      res.status(404).json({ error: 'Flashcard not found.' });
      return;
    }

    await prisma.flashcard.delete({ where: { id } });
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('[Delete Flashcard Error]:', error);
    res.status(500).json({ error: 'Failed to delete flashcard.' });
  }
};
