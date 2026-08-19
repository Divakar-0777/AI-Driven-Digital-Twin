import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ChatService } from '../services/ChatService';

export const handleChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter string is required' });
    }

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1] || '';

    const reply = await ChatService.sendMessage(userId, query, token);
    return res.status(200).json(reply);
  } catch (error: any) {
    console.error('Chat Controller Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to communicate with conversational AI' });
  }
};
