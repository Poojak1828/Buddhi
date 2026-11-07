import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';

export interface SwitchMessagePayload {
  channelId?: string;
  channelName?: string;
  userName?: string;
  userEmail?: string;
  text: string;
  source?: 'TELEGRAM' | 'SWITCH_CONSOLE' | 'SIMULATOR' | 'MATTERMOST';
  telegramChatId?: string;
}

export interface SwitchAgentResponse {
  replyText: string;
  actionRequired?: boolean;
  actionType?: 'CREATE_PLAN' | 'REORGANIZE_SCHEDULE' | 'GENERATE_QUIZ' | 'LOG_TASK_COMPLETED';
  actionSummary?: string;
  actionPayload?: any;
  actionId?: string;
}

export class SwitchService {
  /**
   * Process incoming student message from Switch / Mattermost room
   */
  async processRoomMessage(payload: SwitchMessagePayload): Promise<SwitchAgentResponse> {
    const rawText = payload.text || '';
    const cleanText = rawText.trim();
    const lower = cleanText.toLowerCase();

    // Find student in DB (default to demo student if not specified)
    let user = payload.userEmail
      ? await prisma.user.findUnique({
          where: { email: payload.userEmail },
          include: { profile: true },
        })
      : null;

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: 'student@buddhi.ai' },
        include: { profile: true },
      });
    }

    if (!user) {
      return {
        replyText: `[Buddhi Agent]: Welcome to the Switch Study Room! Please register at the Buddhi Web App first so I can access your academic syllabus and tasks.`,
      };
    }

    // 1. Check if student asks to mark a task completed (check before generic 'task' lookup)
    if (lower.startsWith('completed task') || lower.startsWith('done task') || lower.includes('finished task') || lower.includes('complete task')) {
      const match = cleanText.match(/\d+/);
      const taskIndex = match ? parseInt(match[0], 10) - 1 : 0;

      const pendingTasks = await prisma.studyTask.findMany({
        where: { userId: user.id, isCompleted: false },
        orderBy: { dueDate: 'asc' },
      });

      if (pendingTasks[taskIndex]) {
        const targetTask = pendingTasks[taskIndex];
        await prisma.studyTask.update({
          where: { id: targetTask.id },
          data: { isCompleted: true, status: 'COMPLETED', completedAt: new Date() },
        });

        const agentAction = await prisma.agentAction.create({
          data: {
            userId: user.id,
            actionType: 'TASK_COMPLETED',
            source: 'SWITCH_TELEGRAM',
            summary: `Marked task '${targetTask.title}' as completed via Switch chat room.`,
            status: 'EXECUTED',
            switchRoomId: payload.channelName || 'buddhi-study-room',
          },
        });

        return {
          replyText: `✅ **Great work, ${user.name}!**\n\nI have marked **"${targetTask.title}"** as completed and synchronized your Buddhi Web Dashboard. Every focused session builds neurological permanence. Take a quick 5-minute breather!`,
          actionType: 'LOG_TASK_COMPLETED',
          actionSummary: `Completed task: ${targetTask.title}`,
          actionId: agentAction.id,
        };
      }
    }

    // 2. Check if student says they are falling behind, overwhelmed, or need reorganization
    if (lower.includes('behind') || lower.includes('reorganize') || lower.includes('reschedule') || lower.includes('overwhelmed') || lower.includes('sick') || lower.includes('burnout')) {
      // Find overdue or pending tasks and extend them
      const pendingTasks = await prisma.studyTask.findMany({
        where: { userId: user.id, isCompleted: false },
        take: 4,
      });

      for (const t of pendingTasks) {
        const newDate = new Date(t.dueDate || new Date());
        newDate.setDate(newDate.getDate() + 2);
        await prisma.studyTask.update({
          where: { id: t.id },
          data: { dueDate: newDate },
        });
      }

      await prisma.agentAction.create({
        data: {
          userId: user.id,
          actionType: 'REORGANIZE_SCHEDULE',
          source: 'SWITCH_TELEGRAM',
          summary: `Shifted ${pendingTasks.length} pending tasks forward by 2 days with psychological decompression buffer.`,
          status: 'EXECUTED',
          switchRoomId: payload.channelName || 'buddhi-study-room',
        },
      });

      return {
        replyText: `🌿 **Buddhi Empathetic Support**: Please don't stress, ${user.name}. Your mental well-being is the engine of your long-term success. \n\nI have automatically reorganized your schedule: shifted ${pendingTasks.length} pending tasks forward by 2 days and created a rest buffer. Open your Buddhi Dashboard to see the relaxed timeline. Drink some water and take care of yourself first!`,
        actionType: 'REORGANIZE_SCHEDULE',
        actionSummary: 'Schedule softened and shifted +2 days',
      };
    }

    // 3. Check if student approves the proposed plan
    if (lower.includes('approve plan') || lower.includes('confirm plan') || lower.includes('yes approve') || lower.includes('accept plan')) {
      const pendingAction = await prisma.agentAction.findFirst({
        where: { userId: user.id, actionType: 'CREATE_PLAN', status: 'SUGGESTED' },
        orderBy: { createdAt: 'desc' },
      });

      if (pendingAction && pendingAction.payloadJson) {
        const planData = JSON.parse(pendingAction.payloadJson);

        const createdPlan = await prisma.studyPlan.create({
          data: {
            userId: user.id,
            subjectId: planData.subjectId || undefined,
            title: planData.title,
            description: planData.summary,
            dailyHours: planData.dailyHours || user.profile?.dailyAvailableHours || 4.0,
            status: 'APPROVED',
            planSummary: planData.summary,
            rawScheduleJson: JSON.stringify(planData.schedule),
          },
        });

        // Create tasks in DB
        const tasks: any[] = [];
        planData.schedule.forEach((d: any, idx: number) => {
          const taskDueDate = new Date();
          taskDueDate.setDate(taskDueDate.getDate() + idx);
          d.tasks.forEach((t: any) => {
            tasks.push({
              userId: user.id,
              studyPlanId: createdPlan.id,
              subjectId: planData.subjectId || undefined,
              title: t.title,
              description: t.description,
              priority: t.priority || 'MEDIUM',
              durationMin: t.durationMin || 45,
              dueDate: taskDueDate,
              status: 'PENDING',
            });
          });
        });

        await prisma.studyTask.createMany({ data: tasks });

        if (planData.subjectId && planData.examDate) {
          await prisma.subject.update({
            where: { id: planData.subjectId },
            data: { examDate: new Date(planData.examDate) },
          });
        }

        await prisma.agentAction.update({
          where: { id: pendingAction.id },
          data: { status: 'APPROVED' },
        });

        return {
          replyText: `✨ **Examination Plan Approved & Activated!**\n\nI have generated and scheduled **${tasks.length} structured study tasks** in your Buddhi database, synchronized with your upcoming examination timeline.\n\nOpen your Buddhi Web Dashboard at http://localhost:5173/dashboard to track your countdown and start checking off milestones!`,
          actionType: 'CREATE_PLAN',
          actionSummary: `Plan '${planData.title}' approved with ${tasks.length} tasks`,
        };
      }
    }

    // 4. Check if student asks for pending tasks or progress status
    if (lower.includes('task') || lower.includes('pending') || lower.includes('what should i study') || lower.includes('status')) {
      const pendingTasks = await prisma.studyTask.findMany({
        where: { userId: user.id, isCompleted: false },
        include: { subject: true },
        take: 5,
        orderBy: { dueDate: 'asc' },
      });

      if (pendingTasks.length === 0) {
        return {
          replyText: `🎉 **Buddhi Study Teammate Report**: All current study tasks are completed! You have maintained an active study streak of **${user.profile?.streakCount || 1} days**. Would you like me to generate a new practice quiz or plan the next chapter?`,
        };
      }

      let taskListStr = pendingTasks
        .map((t, idx) => `${idx + 1}. **[${t.subject?.name || 'General'}]** ${t.title} (${t.durationMin}m, Priority: ${t.priority})`)
        .join('\n');

      return {
        replyText: `📚 **Buddhi Study Teammate – Active Tasks for ${user.name}**:\n\n${taskListStr}\n\n💡 *Tip*: When you complete a task, you can reply: \`Completed task #1\` or mark it on the Buddhi Dashboard!`,
      };
    }

    // 5. Check if student asks for a Study Plan / Examination Schedule
    const isQuizRequest = lower.includes('quiz') || lower.includes('test') || lower.includes('practice questions') || lower.includes('practice question');
    if (!isQuizRequest && (lower.includes('plan') || lower.includes('schedule') || lower.includes('syllabus') || lower.includes('exam'))) {
      const userSubjects = await prisma.subject.findMany({
        where: { userId: user.id },
      });

      // Match subject mentioned in text or fall back to first subject
      let matchedSubject = userSubjects.find((s) => lower.includes(s.name.toLowerCase()));
      if (!matchedSubject && userSubjects.length > 0) {
        matchedSubject = userSubjects[0];
      }

      // Detect examination date if mentioned
      let detectedExamDate: Date | null = null;
      const dateMatch =
        cleanText.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?/i) ||
        cleanText.match(/\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*\d{4})?/i) ||
        cleanText.match(/\d{4}-\d{2}-\d{2}/);

      if (dateMatch) {
        const parsed = new Date(dateMatch[0]);
        if (!isNaN(parsed.getTime())) {
          if (parsed.getFullYear() < 2026) parsed.setFullYear(2026);
          detectedExamDate = parsed;
        }
      } else {
        const daysMatch = cleanText.match(/in\s+(\d+)\s+days?/i);
        const weeksMatch = cleanText.match(/in\s+(\d+)\s+weeks?/i);
        if (daysMatch) {
          detectedExamDate = new Date();
          detectedExamDate.setDate(detectedExamDate.getDate() + parseInt(daysMatch[1], 10));
        } else if (weeksMatch) {
          detectedExamDate = new Date();
          detectedExamDate.setDate(detectedExamDate.getDate() + parseInt(weeksMatch[1], 10) * 7);
        }
      }

      // If exam date detected, update subject in DB
      if (detectedExamDate && matchedSubject) {
        await prisma.subject.update({
          where: { id: matchedSubject.id },
          data: { examDate: detectedExamDate },
        });
      }

      // Detect available hours
      const hoursMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)/i);
      const dailyHours = hoursMatch ? parseFloat(hoursMatch[1]) : (user.profile?.dailyAvailableHours || 4.0);

      const planDraft = await aiService.generateStudyPlan({
        subjectName: matchedSubject?.name || 'Physics',
        syllabus: cleanText,
        dailyHours,
        examDate: detectedExamDate ? detectedExamDate.toISOString().split('T')[0] : undefined,
        prepLevel: 'Intermediate',
        academicLevel: user.profile?.academicLevel || 'Curriculum',
      });

      // Log proposed Agent Action for student approval
      const agentAction = await prisma.agentAction.create({
        data: {
          userId: user.id,
          actionType: 'CREATE_PLAN',
          source: 'SWITCH_TELEGRAM',
          summary: `Generated ${planDraft.title} for ${matchedSubject?.name || 'Exam'} with ${planDraft.schedule.length} daily milestones.`,
          payloadJson: JSON.stringify({
            ...planDraft,
            subjectId: matchedSubject?.id,
            dailyHours,
            examDate: detectedExamDate ? detectedExamDate.toISOString() : undefined,
          }),
          status: 'SUGGESTED',
          switchRoomId: payload.channelName || 'buddhi-study-room',
        },
      });

      const examCountdownNotice = detectedExamDate
        ? `\n🎯 **Exam Date Synchronized:** ${detectedExamDate.toLocaleDateString()} (Updated on Buddhi Subjects Page)\n`
        : '';

      return {
        replyText: `🤖 **Buddhi Study Teammate – Proposed Study Plan**:\n\n**${planDraft.title}**\n${planDraft.summary}\n${examCountdownNotice}\n📅 **First 3 Milestones:**\n${planDraft.schedule.slice(0, 3).map((d) => `• **${d.dateLabel}**: ${d.tasks.map((t) => t.title).join(', ')}`).join('\n')}\n\n⚠️ **Action Required**: Reply with \`Approve plan\` to synchronize these tasks to your Buddhi calendar and dashboard, or reply to modify parameters.`,
        actionRequired: true,
        actionType: 'CREATE_PLAN',
        actionSummary: planDraft.title,
        actionPayload: planDraft,
        actionId: agentAction.id,
      };
    }

    // 6. Check if student requests a practice quiz or revision questions
    if (lower.includes('quiz') || lower.includes('test') || lower.includes('practice questions')) {
      const userSubjects = await prisma.subject.findMany({ where: { userId: user.id } });
      let matchedSubject = userSubjects.find((s) => lower.includes(s.name.toLowerCase()));
      if (!matchedSubject && userSubjects.length > 0) {
        matchedSubject = userSubjects[0];
      }

      // Topic extraction heuristic
      let topic = 'Core Diagnostic';
      if (lower.includes('optics')) topic = 'Wave Optics & Ray Optics';
      else if (lower.includes('mechanics')) topic = 'Rotational Mechanics';
      else if (lower.includes('radiation') || lower.includes('modern physics')) topic = 'Dual Nature of Radiation';
      else if (lower.includes('semiconductor')) topic = 'Semiconductor Devices';

      const quiz = await aiService.generateQuiz({
        subjectName: matchedSubject?.name || 'Physics',
        topic,
        difficulty: 'MEDIUM',
        totalQuestions: 2,
        academicLevel: user.profile?.academicLevel || 'Curriculum',
      });

      // Persist the quiz into PostgreSQL database so it is immediately accessible on the website!
      const createdQuiz = await prisma.quiz.create({
        data: {
          userId: user.id,
          subjectId: matchedSubject?.id,
          title: quiz.title,
          topic,
          difficulty: 'MEDIUM',
          totalQuestions: quiz.questions.length,
          questions: {
            create: quiz.questions.map((q, idx) => ({
              questionText: q.questionText,
              optionsJson: JSON.stringify(q.options),
              correctIndex: q.correctIndex,
              explanation: q.explanation || 'Verified concept breakdown.',
              orderIndex: idx,
            })),
          },
        },
      });

      await prisma.agentAction.create({
        data: {
          userId: user.id,
          actionType: 'QUIZ_GENERATED',
          source: 'SWITCH_TELEGRAM',
          summary: `Generated and persisted quiz '${quiz.title}' (${topic}) via Switch room.`,
          status: 'EXECUTED',
          switchRoomId: payload.channelName || 'buddhi-study-room',
        },
      });

      return {
        replyText: `📝 **Buddhi Quick Quiz Challenge: ${quiz.title}**\n\n` +
          quiz.questions
            .map(
              (q, idx) =>
                `**Q${idx + 1}: ${q.questionText}**\n` +
                q.options.map((opt, oIdx) => `  (${String.fromCharCode(65 + oIdx)}) ${opt}`).join('\n')
            )
            .join('\n\n') +
          `\n\n✅ *Synchronized to PostgreSQL*: This quiz is now live in your **Buddhi Web App** (Quizzes tab ID: \`${createdQuiz.id.slice(0, 8)}\`). You can take it interactively with immediate score calculation!`,
        actionType: 'GENERATE_QUIZ',
        actionSummary: `Quiz '${quiz.title}' created`,
      };
    }

    // 7. General concept question / psychological study encouragement
    const chatResponse = await aiService.chatAssistant({
      message: cleanText,
      academicLevel: user.profile?.academicLevel || undefined,
      studentName: user.name,
      currentStreak: user.profile?.streakCount,
      stressLevelNotes: user.profile?.stressLevelNotes || undefined,
    });

    return {
      replyText: `🎓 **Buddhi**: ${chatResponse.reply}`,
    };
  }
}

export const switchService = new SwitchService();
