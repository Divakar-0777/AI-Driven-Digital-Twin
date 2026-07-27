import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';

export const getActivityHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const history = await prisma.activityHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
    return res.status(200).json(history);
  } catch (error) {
    console.error('Get Activity History Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
