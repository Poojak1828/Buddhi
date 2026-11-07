import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const logSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { durationMinutes, sessionType, subjectId, notes } = req.body;

    if (!durationMinutes) {
      res.status(400).json({ error: 'Duration minutes is required.' });
      return;
    }

    const session = await prisma.studySession.create({
      data: {
        userId,
        durationMinutes: parseInt(durationMinutes, 10),
        sessionType: sessionType || 'POMODORO',
        subjectId: subjectId || null,
        notes: notes || null,
      },
      include: {
        subject: { select: { name: true, color: true } },
      },
    });

    res.status(201).json({ session, message: 'Focus session recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log focus session.' });
  }
};

export const getSessionHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve study sessions.' });
  }
};
