import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ActivityRepository } from '../repositories/ActivityRepository';

export const getActivityHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const activities = await ActivityRepository.findByUserId(userId);
    return res.status(200).json(activities);
  } catch (error: any) {
    console.error('Get Activity History Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
