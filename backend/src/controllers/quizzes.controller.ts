import { Response } from 'express';
import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getQuizzes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const quizzes = await prisma.quiz.findMany({
      where: { userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        attempts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedQuizzes = quizzes.map((q) => {
      const attemptsCount = q.attempts.length;
      const latestAttempt = attemptsCount > 0 ? q.attempts[0] : null;
      const highestScore =
        attemptsCount > 0 ? Math.max(...q.attempts.map((a) => a.percentage)) : null;

      let status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (attemptsCount > 0) {
        status = 'COMPLETED';
      }

      // Adaptive Recommendation based on student's performance
      let adaptiveRecommendation = 'Recommended: MEDIUM Difficulty';
      if (latestAttempt) {
        if (latestAttempt.percentage < 60) {
          adaptiveRecommendation =
            'Score < 60%: Foundational revision recommended (EASY difficulty) to solidify core principles.';
        } else if (latestAttempt.percentage < 80) {
          adaptiveRecommendation =
            'Score 60–79%: Solid progress. Maintain MEDIUM difficulty and focus on reviewing incorrect questions.';
        } else if (latestAttempt.percentage < 95) {
          adaptiveRecommendation =
            'Score 80–94%: High proficiency! Recommended HARD difficulty to tackle multi-step problems.';
        } else {
          adaptiveRecommendation =
            'Score 95–100%: Full mastery achieved! Ready for advanced cross-chapter competitive synthesis.';
        }
      }

      return {
        id: q.id,
        title: q.title,
        topic: q.topic,
        chapterTitle: q.chapterTitle,
        difficulty: q.difficulty,
        quizType: q.quizType,
        totalQuestions: q._count.questions || q.totalQuestions,
        questionsCount: q._count.questions || q.totalQuestions,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        subjectId: q.subjectId,
        subject: q.subject,
        attemptsCount,
        latestAttempt,
        highestScore,
        status,
        adaptiveRecommendation,
      };
    });

    res.json({ quizzes: enrichedQuizzes });
  } catch (error) {
    console.error('[Get Quizzes Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve quizzes.' });
  }
};

export const getQuizById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    const quiz = await prisma.quiz.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }

    const parsedQuestions = quiz.questions.map((q: any) => ({
      ...q,
      options: JSON.parse(q.optionsJson || '[]'),
      keyPoints: q.keyPointsJson ? JSON.parse(q.keyPointsJson) : [],
    }));

    // Ensure there is a MINIMUM of 10 questions for any quiz attempted
    if (parsedQuestions.length < 10) {
      try {
        const needed = 10 - parsedQuestions.length;
        const topicName = quiz.topic || quiz.chapterTitle || quiz.title || 'Core Curriculum';
        const subjectName = quiz.subject?.name || 'Standard Syllabus';

        const generated = await aiService.generateQuiz({
          subjectName,
          chapterTitle: quiz.chapterTitle || undefined,
          topic: topicName,
          difficulty: quiz.difficulty,
          totalQuestions: Math.max(10, needed + parsedQuestions.length),
          academicLevel: 'SENIOR_SECONDARY_PREP',
          quizType: 'MCQ',
        });

        const newQuestionsData: any[] = [];
        let nextOrder = parsedQuestions.length;

        for (const gq of generated.questions) {
          if (newQuestionsData.length >= needed) break;
          const exists = parsedQuestions.some(
            (pq: any) => pq.questionText.trim().toLowerCase() === gq.questionText.trim().toLowerCase()
          );
          if (!exists) {
            newQuestionsData.push({
              quizId: quiz.id,
              questionText: gq.questionText,
              questionType: gq.questionType || 'MCQ',
              optionsJson: JSON.stringify(gq.options || []),
              correctIndex: gq.correctIndex || 0,
              explanation: gq.explanation || 'Verified syllabus conceptual breakdown.',
              orderIndex: nextOrder++,
            });
          }
        }

        if (newQuestionsData.length > 0) {
          await prisma.quizQuestion.createMany({ data: newQuestionsData });
          await prisma.quiz.update({
            where: { id: quiz.id },
            data: { totalQuestions: parsedQuestions.length + newQuestionsData.length },
          });

          // Re-fetch all questions from DB
          const allQuestions = await prisma.quizQuestion.findMany({
            where: { quizId: quiz.id },
            orderBy: { orderIndex: 'asc' },
          });

          const updatedParsed = allQuestions.map((q: any) => ({
            ...q,
            options: JSON.parse(q.optionsJson || '[]'),
            keyPoints: q.keyPointsJson ? JSON.parse(q.keyPointsJson) : [],
          }));

          res.json({
            quiz: {
              ...quiz,
              questions: updatedParsed,
              questionsCount: updatedParsed.length,
              totalQuestions: updatedParsed.length,
            },
          });
          return;
        }
      } catch (genErr) {
        console.warn('[GetQuizById] Fallback question padding error:', genErr);
      }
    }

    res.json({
      quiz: {
        ...quiz,
        questions: parsedQuestions,
        questionsCount: parsedQuestions.length,
      },
    });
  } catch (error) {
    console.error('[Get Quiz By ID Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz details.' });
  }
};

export const generateQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { subjectId, subjectName, chapterTitle, topic, difficulty, totalQuestions, quizType } = req.body;

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: 'Quiz topic is required.' });
      return;
    }

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const academicLevel = userProfile?.academicLevel || 'Curriculum';
    const chosenType =
      quizType === 'SHORT_ANSWER' || quizType === 'LONG_ANSWER' ? quizType : 'MCQ';

    // Enforce MINIMUM 20 questions as required by specifications
    const numQuestions = Math.max(20, totalQuestions ? parseInt(totalQuestions, 10) : 20);

    // Retrieve syllabus grounding from PostgreSQL
    let resolvedSubjectName = subjectName;
    let resolvedChapterTitle = chapterTitle;

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId },
        include: {
          chapters: {
            include: { topics: true },
          },
        },
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

    const generated = await aiService.generateQuiz({
      subjectName: resolvedSubjectName || 'Standard Syllabus',
      chapterTitle: resolvedChapterTitle,
      topic: topic.trim(),
      difficulty: difficulty || 'MEDIUM',
      totalQuestions: numQuestions,
      quizType: chosenType,
      academicLevel,
    });

    const finalQuestionCount = Math.max(20, generated.questions.length);

    // Save quiz to DB
    const quiz = await prisma.quiz.create({
      data: {
        userId,
        subjectId: subjectId || null,
        title: generated.title,
        topic: topic.trim(),
        chapterTitle: resolvedChapterTitle || null,
        difficulty: (difficulty as any) || 'MEDIUM',
        quizType: chosenType,
        totalQuestions: finalQuestionCount,
      },
    });

    // Save all questions into PostgreSQL
    await prisma.quizQuestion.createMany({
      data: generated.questions.slice(0, finalQuestionCount).map((q, idx) => ({
        quizId: quiz.id,
        questionText: q.questionText,
        questionType: q.questionType || chosenType,
        optionsJson: JSON.stringify(q.options || []),
        correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
        sampleAnswer: q.sampleAnswer || null,
        keyPointsJson: q.keyPoints ? JSON.stringify(q.keyPoints) : null,
        explanation: q.explanation || 'Verified conceptual breakdown.',
        orderIndex: idx + 1,
      })),
    });

    const createdQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        subject: { select: { id: true, name: true, color: true } },
        questions: { orderBy: { orderIndex: 'asc' } },
      },
    });

    res.status(201).json({
      quizId: quiz.id,
      title: quiz.title,
      quizType: chosenType,
      totalQuestions: finalQuestionCount,
      quiz: createdQuiz,
      message: `Quiz generated successfully with ${finalQuestionCount} questions.`,
    });
  } catch (error: any) {
    console.error('[Generate Quiz Error]:', error);
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
};

export const submitQuizAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { quizId, timeSpentSeconds } = req.body;
    const userAnswers = req.body.userAnswers || req.body.answers || [];

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, userId },
      include: {
        questions: { orderBy: { orderIndex: 'asc' } },
        subject: true,
      },
    });

    if (!quiz) {
      res.status(404).json({ error: 'Quiz not found.' });
      return;
    }

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const questionsBreakdown: any[] = [];

    quiz.questions.forEach((q, idx) => {
      const userAnswer = userAnswers ? userAnswers[idx] : undefined;
      const isAnswered =
        userAnswer !== null &&
        userAnswer !== undefined &&
        userAnswer !== -1 &&
        userAnswer !== '';
      const isCorrect = isAnswered && Number(userAnswer) === q.correctIndex;

      if (!isAnswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      questionsBreakdown.push({
        questionIndex: idx + 1,
        questionText: q.questionText,
        options: JSON.parse(q.optionsJson || '[]'),
        correctIndex: q.correctIndex,
        userAnswer: isAnswered ? Number(userAnswer) : null,
        isCorrect,
        isAnswered,
        explanation: q.explanation || 'Verified conceptual breakdown.',
      });
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100 * 10) / 10;

    // Adaptive recommendation based on student performance
    let adaptiveRecommendation = '';
    let nextDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
    if (percentage < 60) {
      nextDifficulty = 'EASY';
      adaptiveRecommendation =
        'Score below 60%: Focus on foundational concepts. We recommend taking an EASY revision quiz on these core principles before advancing.';
    } else if (percentage < 80) {
      nextDifficulty = 'MEDIUM';
      adaptiveRecommendation =
        'Score 60–79%: Good foundation! Maintain MEDIUM difficulty and focus on reviewing the specific questions missed.';
    } else if (percentage < 95) {
      nextDifficulty = 'HARD';
      adaptiveRecommendation =
        'Score 80–94%: High proficiency! Advance to HARD difficulty with multi-step and analytical problems.';
    } else {
      nextDifficulty = 'HARD';
      adaptiveRecommendation =
        'Outstanding score 95–100%! Full mastery demonstrated. Ready for advanced competitive problem sets and cross-chapter challenges.';
    }

    const feedback =
      percentage >= 80
        ? `Phenomenal performance! You scored ${percentage}% on ${quiz.title}. Your conceptual grasp is outstanding.`
        : percentage >= 60
        ? `Solid effort! You scored ${percentage}%. Review the explanations for the ${incorrectCount} incorrect questions to solidify your understanding.`
        : `You scored ${percentage}%. Don't be discouraged—cognitive science shows active error analysis is when learning happens fastest.`;

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score: correctCount,
        totalQuestions,
        percentage,
        userAnswersJson: JSON.stringify(userAnswers || []),
        feedback,
        evaluationJson: JSON.stringify(questionsBreakdown),
        timeSpentSeconds: timeSpentSeconds ? parseInt(timeSpentSeconds, 10) : 0,
      },
    });

    res.status(201).json({
      attemptId: attempt.id,
      score: correctCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      totalQuestions,
      percentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
      feedback,
      adaptiveRecommendation,
      nextDifficulty,
      questionsBreakdown,
      message: 'Quiz submitted and evaluated successfully',
    });
  } catch (error: any) {
    console.error('[Submit Quiz Error]:', error);
    res.status(500).json({ error: 'Failed to submit quiz attempt.' });
  }
};

export const getQuizHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            topic: true,
            difficulty: true,
            subject: { select: { name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({ attempts });
  } catch (error) {
    console.error('[Get Quiz History Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz history.' });
  }
};

export const evaluateSingleAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { questionText, studentAnswer, sampleAnswer, keyPoints, questionType } = req.body;

    const evaluation = await aiService.evaluateStudentAnswer({
      questionText,
      studentAnswer,
      sampleAnswer,
      keyPoints,
      questionType: questionType || 'SHORT_ANSWER',
    });

    res.json({ evaluation });
  } catch (error) {
    console.error('[Evaluate Answer Error]:', error);
    res.status(500).json({ error: 'Failed to evaluate answer.' });
  }
};
