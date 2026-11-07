import { Response } from 'express';
import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectId, search } = req.query;

    let whereClause: any = { userId };
    if (subjectId) {
      whereClause.subjectId = subjectId;
    }
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
};

export const getNoteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve note.' });
  }
};

export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { title, content, subjectId, isPinned, tags, fileName, fileUrl, fileType } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Note title is required.' });
      return;
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        content: content || '',
        subjectId: subjectId || null,
        isPinned: isPinned || false,
        tags: tags || null,
        fileName: fileName || null,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.status(201).json({ note, message: 'Note created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note.' });
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const { title, content, subjectId, isPinned, tags, fileName, fileUrl, fileType } = req.body;

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found or unauthorized.' });
      return;
    }

    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: title || undefined,
        content: content !== undefined ? content : undefined,
        subjectId: subjectId !== undefined ? subjectId : undefined,
        isPinned: isPinned !== undefined ? isPinned : undefined,
        tags: tags !== undefined ? tags : undefined,
        fileName: fileName !== undefined ? fileName : undefined,
        fileUrl: fileUrl !== undefined ? fileUrl : undefined,
        fileType: fileType !== undefined ? fileType : undefined,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.json({ note: updated, message: 'Note updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note.' });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found or unauthorized.' });
      return;
    }

    await prisma.note.delete({ where: { id } });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

export const summarizeNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    const summary = `### Summary Takeaways for ${note.title}:
- **Core Principle**: Identifies the fundamental relationships and governing mechanics.
- **Key Equations & Concepts**: Retains structural boundary values and unit conversions.
- **Actionable Revision**: Review again in 48 hours for spaced repetition recall.`;

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to summarize note.' });
  }
};

export const generateFlashcardsFromNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: { subject: true },
    });
    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const academicLevel = userProfile?.academicLevel || 'Curriculum';

    const cards = await aiService.generateFlashcards({
      subjectName: note.subject?.name || 'General',
      topic: note.title,
      content: note.content,
      count: 4,
      academicLevel,
    });

    const created = await prisma.flashcard.createMany({
      data: cards.map((c) => ({
        userId,
        subjectId: note.subjectId,
        deckTitle: note.title,
        question: c.question,
        answer: c.answer,
        keyConcept: c.keyConcept,
        difficulty: c.difficulty,
        masteryStatus: 'LEARNING',
      })),
    });

    res.status(201).json({
      count: created.count,
      message: `Generated and saved ${created.count} flashcards from note!`,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate flashcards from note.' });
  }
};
