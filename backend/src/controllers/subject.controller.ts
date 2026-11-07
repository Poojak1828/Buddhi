import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { curriculumService } from '../services/curriculum.service.js';

export const autoPopulateCurriculum = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const result = await curriculumService.populateCurriculumForStudent(userId, {
      gradeClass: req.body.gradeClass || profile?.gradeClass || 'Class 12',
      board: req.body.board || profile?.board || 'CBSE',
      stream: req.body.stream || profile?.stream || 'Science',
    });

    res.json({
      message: 'Curriculum & pre-generated flashcards synchronized successfully!',
      result,
    });
  } catch (error: any) {
    console.error('[Auto Populate Curriculum Error]:', error);
    res.status(500).json({ error: 'Failed to populate standard curriculum.' });
  }
};

export const getSubjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const subjects = await prisma.subject.findMany({
      where: { userId },
      include: {
        chapters: {
          include: {
            topics: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute updated completion stats per subject
    const subjectsWithStats = subjects.map((subj) => {
      let totalTopics = 0;
      let completedTopics = 0;

      subj.chapters.forEach((chap) => {
        totalTopics += chap.topics.length;
        completedTopics += chap.topics.filter((t) => t.status === 'COMPLETED').length;
      });

      const calculatedPercent =
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : subj.syllabusCompletion;

      return {
        ...subj,
        totalTopics,
        completedTopics,
        syllabusCompletion: calculatedPercent,
      };
    });

    res.json({ subjects: subjectsWithStats });
  } catch (error: any) {
    console.error('[Get Subjects Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve subjects.' });
  }
};

export const getSubjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const subject = await prisma.subject.findFirst({
      where: { id, userId },
      include: {
        chapters: {
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }

    res.json({ subject });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve subject details.' });
  }
};

export const createSubject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { name, code, color, icon, examDate, targetScore } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Subject name is required.' });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        userId,
        name,
        code: code || null,
        color: color || '#38BDF8',
        icon: icon || 'book',
        examDate: examDate ? new Date(examDate) : null,
        targetScore: targetScore ? parseFloat(targetScore) : 90.0,
      },
    });

    res.status(201).json({ subject, message: 'Subject created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subject.' });
  }
};

export const updateSubject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const { name, code, color, icon, examDate, targetScore, syllabusCompletion } = req.body;

    const subject = await prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found or unauthorized.' });
      return;
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code,
        color,
        icon,
        examDate: examDate ? new Date(examDate) : undefined,
        targetScore: targetScore ? parseFloat(targetScore) : undefined,
        syllabusCompletion: syllabusCompletion !== undefined ? parseFloat(syllabusCompletion) : undefined,
      },
    });

    res.json({ subject: updated, message: 'Subject updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject.' });
  }
};

export const deleteSubject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const subject = await prisma.subject.findFirst({ where: { id, userId } });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found or unauthorized.' });
      return;
    }

    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject.' });
  }
};

export const createChapter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectId, title, orderIndex } = req.body;

    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) {
      res.status(404).json({ error: 'Subject not found or unauthorized.' });
      return;
    }

    const chapter = await prisma.chapter.create({
      data: {
        subjectId,
        title,
        orderIndex: orderIndex || 0,
      },
    });

    res.status(201).json({ chapter, message: 'Chapter added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chapter.' });
  }
};

export const createTopic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { chapterId, title, difficulty, orderIndex } = req.body;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { subject: true },
    });

    if (!chapter || chapter.subject.userId !== userId) {
      res.status(404).json({ error: 'Chapter not found or unauthorized.' });
      return;
    }

    const topic = await prisma.topic.create({
      data: {
        chapterId,
        title,
        difficulty: difficulty || 'MEDIUM',
        orderIndex: orderIndex || 0,
      },
    });

    res.status(201).json({ topic, message: 'Topic added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create topic.' });
  }
};

export const updateTopic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const { status, difficulty, title } = req.body;

    const topic = (await prisma.topic.findUnique({
      where: { id },
      include: { chapter: { include: { subject: true } } },
    })) as any;

    if (!topic || topic.chapter.subject.userId !== userId) {
      res.status(404).json({ error: 'Topic not found or unauthorized.' });
      return;
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        status: status || undefined,
        difficulty: difficulty || undefined,
        title: title || undefined,
      },
    });

    // Recalculate subject completion
    const allTopics = await prisma.topic.findMany({
      where: { chapter: { subjectId: topic.chapter.subjectId } },
    });
    const completedCount = allTopics.filter((t) => (t.id === id ? status === 'COMPLETED' : t.status === 'COMPLETED')).length;
    const newPercent = Math.round((completedCount / allTopics.length) * 100);

    await prisma.subject.update({
      where: { id: topic.chapter.subjectId },
      data: { syllabusCompletion: newPercent },
    });

    res.json({ topic: updated, syllabusCompletion: newPercent, message: 'Topic updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update topic.' });
  }
};

export const deleteTopic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const topic = (await prisma.topic.findUnique({
      where: { id },
      include: { chapter: { include: { subject: true } } },
    })) as any;

    if (!topic || topic.chapter.subject.userId !== userId) {
      res.status(404).json({ error: 'Topic not found or unauthorized.' });
      return;
    }

    await prisma.topic.delete({ where: { id } });
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete topic.' });
  }
};
