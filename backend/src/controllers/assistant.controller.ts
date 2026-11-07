import { Response } from 'express';
import { prisma } from '../config/db.js';
import { aiService } from '../ai/ai.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const chatWithAssistant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const { message, conversationId } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message content is required.' });
      return;
    }

    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Find or create conversation
    let conv = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } },
        })
      : null;

    if (!conv) {
      conv = await prisma.aIConversation.create({
        data: {
          userId,
          title: message.slice(0, 35) + '...',
        },
        include: { messages: true },
      });
    }

    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: 'user',
        content: message,
      },
    });

    // Format chat history
    const history = (conv.messages || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Call AI Service
    const aiResponse = await aiService.chatAssistant({
      message,
      history,
      academicLevel: userProfile?.academicLevel || undefined,
      studentName: user?.name?.trim() || undefined,
      currentStreak: userProfile?.streakCount,
      stressLevelNotes: userProfile?.stressLevelNotes || undefined,
    });

    // Save assistant reply
    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: aiResponse.reply,
        emotionalTone: aiResponse.emotionalTone,
      },
    });

    res.json({
      conversationId: conv.id,
      message: assistantMsg,
      response: aiResponse.reply,
      reply: aiResponse.reply,
      suggestedFollowups: aiResponse.suggestedFollowups,
      emotionalTone: aiResponse.emotionalTone,
    });
  } catch (error: any) {
    console.error('[Chat Assistant Error]:', error);
    res.status(500).json({ error: 'Failed to generate assistant response.' });
  }
};

export const getConversationHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve conversation history.' });
  }
};

export const clearConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id!;
    const id = req.params.id as string;

    await prisma.aIConversation.deleteMany({
      where: { id, userId },
    });

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear conversation.' });
  }
};
