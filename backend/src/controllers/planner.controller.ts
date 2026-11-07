import { Response } from 'express';
import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const generatePlanDraft = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectName, subjectId, syllabus, examDate, dailyHours, prepLevel, priorityTopics } = req.body;

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const academicLevel = userProfile?.academicLevel || 'Curriculum';

    const planData = await aiService.generateStudyPlan({
      subjectName: subjectName || 'General Curriculum',
      syllabus: syllabus || 'Foundational syllabus and core concepts',
      examDate,
      dailyHours: dailyHours ? parseFloat(dailyHours) : (userProfile?.dailyAvailableHours || 3.5),
      prepLevel: prepLevel || 'Intermediate',
      academicLevel,
      priorityTopics,
    });

    res.json({
      draft: planData,
      subjectId: subjectId || null,
      message: 'AI study plan draft generated successfully',
    });
  } catch (error: any) {
    console.error('[Generate Plan Error]:', error);
    res.status(500).json({ error: 'Failed to generate study plan.' });
  }
};

export const saveApprovedPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { title, summary, schedule, subjectId, targetExamDate, dailyHours, prepLevel } = req.body;

    if (!title || !schedule || !Array.isArray(schedule)) {
      res.status(400).json({ error: 'Title and schedule array are required.' });
      return;
    }

    const createdPlan = await prisma.studyPlan.create({
      data: {
        userId,
        subjectId: subjectId || null,
        title,
        description: summary || 'Custom AI Generated Study Plan',
        targetExamDate: targetExamDate ? new Date(targetExamDate) : null,
        dailyHours: dailyHours ? parseFloat(dailyHours) : 3.0,
        currentPrepLevel: prepLevel || 'Intermediate',
        status: 'APPROVED',
        planSummary: summary,
        rawScheduleJson: JSON.stringify(schedule),
      },
    });

    // Create tasks from schedule
    const tasksToCreate: any[] = [];
    const baseDate = new Date();

    schedule.forEach((dayItem: any, index: number) => {
      const taskDueDate = new Date(baseDate);
      taskDueDate.setDate(baseDate.getDate() + index);

      if (dayItem.tasks && Array.isArray(dayItem.tasks)) {
        dayItem.tasks.forEach((t: any) => {
          tasksToCreate.push({
            userId,
            studyPlanId: createdPlan.id,
            subjectId: subjectId || null,
            title: t.title || 'Study Milestone',
            description: t.description || '',
            priority: (t.priority as any) || 'MEDIUM',
            status: 'PENDING',
            durationMin: t.durationMin || 45,
            dueDate: taskDueDate,
          });
        });
      }
    });

    if (tasksToCreate.length > 0) {
      await prisma.studyTask.createMany({
        data: tasksToCreate,
      });
    }

    res.status(201).json({
      plan: createdPlan,
      createdTasksCount: tasksToCreate.length,
      message: 'Plan approved and tasks synchronized with database!',
    });
  } catch (error: any) {
    console.error('[Save Plan Error]:', error);
    res.status(500).json({ error: 'Failed to save study plan.' });
  }
};

export const getPlans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const plans = await prisma.studyPlan.findMany({
      where: { userId },
      include: {
        subject: { select: { id: true, name: true, color: true, icon: true } },
        tasks: {
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve study plans.' });
  }
};

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { status, filter } = req.query;

    let whereClause: any = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (filter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.dueDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const tasks = await prisma.studyTask.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, name: true, color: true } },
        studyPlan: { select: { id: true, title: true } },
      },
      orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }, { priority: 'desc' }],
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { title, description, subjectId, studyPlanId, priority, dueDate, durationMin } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const task = await prisma.studyTask.create({
      data: {
        userId,
        title,
        description,
        subjectId: subjectId || null,
        studyPlanId: studyPlanId || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        durationMin: durationMin ? parseInt(durationMin, 10) : 45,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.status(201).json({ task, message: 'Task created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;
    const { title, description, isCompleted, status, priority, dueDate, durationMin } = req.body;

    const task = await prisma.studyTask.findFirst({ where: { id, userId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found or unauthorized.' });
      return;
    }

    const willBeCompleted = isCompleted !== undefined ? isCompleted : status === 'COMPLETED';

    const updated = await prisma.studyTask.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        isCompleted: willBeCompleted,
        status: willBeCompleted ? 'COMPLETED' : status || 'PENDING',
        completedAt: willBeCompleted && !task.isCompleted ? new Date() : willBeCompleted ? task.completedAt : null,
        priority: priority || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        durationMin: durationMin ? parseInt(durationMin, 10) : undefined,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    res.json({ task: updated, message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const task = await prisma.studyTask.findFirst({ where: { id, userId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found or unauthorized.' });
      return;
    }

    await prisma.studyTask.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
};
