import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatService } from '../services/ChatService';
import prisma from '../database/prismaClient';

export const handleChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { query, conversationId } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter string is required' });
    }

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1] || '';

    const reply = await ChatService.sendMessage(userId, query, token);

    // Save messages to conversation
    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const conv = await prisma.chatConversation.create({
        data: { userId, title: query.substring(0, 80) },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { conversationId: convId, role: 'user', content: query },
    });

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: reply.reply || reply.message || 'No response',
        mode: reply.mode || 'Unknown',
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return res.status(200).json({ ...reply, conversationId: convId });
  } catch (error: any) {
    console.error('Chat Controller Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to communicate with conversational AI' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
    });
    return res.status(200).json(conversations);
  } catch (error: any) {
    console.error('Get Conversations Error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversationById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Get Conversation Error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId },
    });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    await prisma.chatMessage.deleteMany({ where: { conversationId: id } });
    await prisma.chatConversation.delete({ where: { id } });
    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Delete Conversation Error:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
};
