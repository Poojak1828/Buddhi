import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, academicLevel } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profile: {
          create: {
            academicLevel: academicLevel || 'SENIOR_SECONDARY_PREP',
            streakCount: 1,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('[Register Error]:', error);
    res.status(500).json({ error: 'Failed to register account.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Update streak if active on a new day
    if (user.profile) {
      const lastActive = new Date(user.profile.lastActiveDate);
      const today = new Date();
      const diffDays = Math.floor(
        (today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24)
      );

      let newStreak = user.profile.streakCount;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }

      await prisma.userProfile.update({
        where: { id: user.profile.id },
        data: {
          lastActiveDate: today,
          streakCount: newStreak,
        },
      });
      user.profile.streakCount = newStreak;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('[Login Error]:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

import { curriculumService } from '../services/curriculum.service.js';

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const {
      name,
      academicLevel,
      gradeClass,
      board,
      stream,
      courseOrDegree,
      targetExams,
      dailyAvailableHours,
      studyGoals,
      preferredSchedule,
      stressLevelNotes,
      autoPopulateCurriculum,
    } = req.body;

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        academicLevel,
        gradeClass,
        board,
        stream,
        courseOrDegree,
        targetExams,
        dailyAvailableHours: dailyAvailableHours ? parseFloat(dailyAvailableHours) : undefined,
        studyGoals,
        preferredSchedule,
        stressLevelNotes,
      },
      create: {
        userId,
        academicLevel: academicLevel || 'SENIOR_SECONDARY_PREP',
        gradeClass: gradeClass || 'Class 12',
        board: board || 'CBSE',
        stream: stream || 'Science',
        courseOrDegree,
        targetExams,
        dailyAvailableHours: dailyAvailableHours ? parseFloat(dailyAvailableHours) : 4.0,
        studyGoals,
        preferredSchedule,
        stressLevelNotes,
      },
    });

    // If autoPopulate requested or first time onboarding, populate standard syllabus & flashcards
    if (autoPopulateCurriculum || autoPopulateCurriculum === undefined) {
      await curriculumService.populateCurriculumForStudent(userId, {
        gradeClass: updatedProfile.gradeClass || undefined,
        board: updatedProfile.board || undefined,
        stream: updatedProfile.stream || undefined,
      });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};
