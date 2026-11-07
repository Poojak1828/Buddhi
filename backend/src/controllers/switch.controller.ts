import { Request, Response } from 'express';
import { switchService } from '../switch/switch.service.js';
import { prisma } from '../config/db.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

/**
 * Handle incoming Telegram Bot webhook updates
 */
export const handleTelegramWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const update = req.body;
    const message = update.message || update.edited_message || update.channel_post;

    if (!message || !message.text) {
      res.json({ ok: true, status: 'ignored_non_text' });
      return;
    }

    const chatId = String(message.chat?.id || '');
    const senderName = message.from?.first_name || message.from?.username || 'Student';
    const messageText = message.text;

    // Check if new members were added to group
    if (message.new_chat_members && message.new_chat_members.length > 0) {
      const addedNames = message.new_chat_members.map((m: any) => m.first_name || m.username).join(', ');
      res.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `👋 Welcome ${addedNames} to the Buddhi Study Circle! I am Buddhi AI, your collaborative study teammate. You can ask me for study plans, test quizzes, or concept breakdowns.`,
      });
      return;
    }

    // Process through Switch Service
    const agentResult = await switchService.processRoomMessage({
      text: messageText,
      userName: senderName,
      channelName: message.chat?.title || `telegram-${chatId}`,
      source: 'TELEGRAM',
      telegramChatId: chatId,
    });

    // Telegram bot API response
    res.json({
      method: 'sendMessage',
      chat_id: chatId,
      text: agentResult.replyText,
      parse_mode: 'Markdown',
    });
  } catch (error: any) {
    console.error('[Telegram Webhook Error]:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Handle legacy or generic Switch Webhook
 */
export const handleSwitchWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, user_name, channel_name, token, user_email } = req.body;

    if (config.switchWebhookSecret && token && token !== config.switchWebhookSecret) {
      console.warn('[Switch Webhook] Warning: Token mismatch from webhook caller');
    }

    const messageText = text || req.body.message || req.body.prompt || req.body.content || '';
    if (!messageText) {
      res.json({ text: '[Buddhi]: Received empty message payload.' });
      return;
    }

    const channelName = channel_name || req.body.room || req.body.channel || config.switchRoomName;
    const userName = user_name || req.body.sender || req.body.user || 'Student';
    const userEmail = user_email || req.body.email || req.body.userEmail;

    const agentResult = await switchService.processRoomMessage({
      text: messageText,
      userName,
      userEmail,
      channelName,
      source: 'TELEGRAM',
    });

    res.json({
      response_type: 'in_channel',
      text: agentResult.replyText,
      username: 'buddhi_bot',
      props: {
        actionRequired: agentResult.actionRequired,
        actionType: agentResult.actionType,
        actionSummary: agentResult.actionSummary,
      },
    });
  } catch (error: any) {
    console.error('[Switch Webhook Error]:', error);
    res.status(500).json({ text: `[Buddhi Agent Error]: ${error.message}` });
  }
};

/**
 * Interactive simulation endpoint for demo & testing
 */
export const simulateSwitchChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text, userEmail, channelName } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text prompt is required.' });
      return;
    }

    const effectiveEmail = req.user?.email || userEmail;
    const effectiveName = req.user?.name;

    const result = await switchService.processRoomMessage({
      text,
      userEmail: effectiveEmail,
      userName: effectiveName,
      channelName: channelName || 'buddhi-study-circle',
      source: 'TELEGRAM',
    });

    res.json({
      result,
      response: result.replyText,
      timestamp: new Date().toISOString(),
      room: channelName || 'buddhi-study-circle',
    });
  } catch (error: any) {
    console.error('[Simulate Switch Chat Error]:', error);
    res.status(500).json({ error: 'Failed to process simulated chat.' });
  }
};

/**
 * Get Switch Rooms & Teammates for authenticated user
 */
export const getSwitchRooms = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    let rooms = await prisma.switchRoom.findMany({
      where: { userId },
      include: {
        teammates: { orderBy: { joinedAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-create default room if none exists
    if (rooms.length === 0) {
      const defaultRoom = await prisma.switchRoom.create({
        data: {
          userId,
          name: 'Buddhi Study Circle (Telegram)',
          platform: 'TELEGRAM',
          telegramChatId: '@BuddhiStudyBot',
          isShared: true,
          teammates: {
            create: [
              { name: `${req.user?.name || 'You'} (You)`, handle: `@${(req.user?.name || 'student').toLowerCase().replace(/\s+/g, '_')}`, role: 'STUDENT', isAdded: true },
              { name: 'Priya Patel', handle: '@priya_studies', role: 'STUDY_BUDDY', isAdded: true },
              { name: 'Dr. Rao (Mentor)', handle: '@dr_rao_mentor', role: 'MENTOR', isAdded: true },
            ],
          },
        },
        include: { teammates: true },
      });
      rooms = [defaultRoom];
    }

    res.json({ rooms });
  } catch (error) {
    console.error('[Get Switch Rooms Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve Switch rooms.' });
  }
};

/**
 * Create or enable a new Switch Room
 */
export const createSwitchRoom = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { name, telegramChatId, isShared } = req.body;

    const room = await prisma.switchRoom.create({
      data: {
        userId,
        name: name || 'Collaborative Study Group',
        platform: 'TELEGRAM',
        telegramChatId: telegramChatId || '@BuddhiStudyBot',
        isShared: isShared !== undefined ? isShared : true,
      },
      include: { teammates: true },
    });

    res.status(201).json({ room, message: 'Switch study room created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create Switch study room.' });
  }
};

/**
 * Add teammate or group to Switch Room
 */
export const addSwitchTeammate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const roomId = req.params.roomId as string;
    const { name, handle, role } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Teammate name is required.' });
      return;
    }

    // Verify room ownership
    const room = await prisma.switchRoom.findFirst({
      where: { id: roomId, userId },
    });

    if (!room) {
      res.status(404).json({ error: 'Switch room not found.' });
      return;
    }

    const teammate = await prisma.switchTeammate.create({
      data: {
        roomId,
        name,
        handle: handle ? (handle.startsWith('@') ? handle : `@${handle}`) : null,
        role: role || 'STUDY_BUDDY',
        isAdded: true,
      },
    });

    // Record agent action that teammate joined room
    await prisma.agentAction.create({
      data: {
        userId,
        actionType: 'TEAMMATE_ADDED',
        source: 'SWITCH_TELEGRAM',
        summary: `Added teammate ${name} (${handle || 'group'}) to Switch Room "${room.name}". Shared collaborative chat active.`,
        status: 'EXECUTED',
        switchRoomId: room.name,
      },
    });

    res.status(201).json({ teammate, message: `${name} has been added to the Switch room and can access shared study updates.` });
  } catch (error) {
    console.error('[Add Teammate Error]:', error);
    res.status(500).json({ error: 'Failed to add teammate to Switch room.' });
  }
};

/**
 * Delete teammate from Switch Room
 */
export const deleteSwitchTeammate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const teammateId = req.params.teammateId as string;

    const teammate = await prisma.switchTeammate.findUnique({
      where: { id: teammateId },
      include: { room: true },
    });

    if (!teammate || teammate.room.userId !== userId) {
      res.status(404).json({ error: 'Teammate not found or unauthorized.' });
      return;
    }

    await prisma.switchTeammate.delete({ where: { id: teammateId } });

    res.json({ message: 'Teammate removed from Switch room.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove teammate.' });
  }
};

/**
 * Get Switch status and bot details
 */
export const getSwitchStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const actionsCount = await prisma.agentAction.count();
    const recentAction = await prisma.agentAction.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'ONLINE',
      agentName: 'Buddhi AI Telegram Bot',
      botHandle: '@BuddhiStudyBot',
      roomName: config.switchRoomName || 'buddhi-study-circle',
      webhookEndpoint: `/api/switch/telegram-webhook`,
      totalActionsLogged: actionsCount,
      lastAction: recentAction,
      supportedWorkflows: [
        'Goal & Exam sharing in group or 1-on-1',
        'Study plan synthesis with multi-teammate access',
        'Task breakdown & approval',
        'Incomplete task reporting & schedule reorganization',
        'Interactive practice quiz generation (MCQ, Short, Long)',
        'Psychological decompression & empathetic encouragement',
      ],
      connectedPlatform: 'Telegram Bot (@BuddhiStudyBot) & Switch Connector',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Switch status.' });
  }
};

export const getSwitchActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const actions = await prisma.agentAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.json({ actions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve agent actions.' });
  }
};

export const approveAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { actionId } = req.body;

    const action = await prisma.agentAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      res.status(404).json({ error: 'Action not found.' });
      return;
    }

    const updated = await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: 'APPROVED' },
    });

    res.json({
      action: updated,
      message: 'Agent action approved and confirmed in database.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve agent action.' });
  }
};
