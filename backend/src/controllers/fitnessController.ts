import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FitnessActivitySchema } from '../validators';
import { FitnessService } from '../services/FitnessService';

export const addFitnessActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = FitnessActivitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const activity = await FitnessService.addActivity(userId, {
      ...parseResult.data,
      activityDate: parseResult.data.activityDate ? new Date(parseResult.data.activityDate) : undefined,
    });
    return res.status(201).json(activity);
  } catch (error: any) {
    console.error('Add Fitness Activity Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getFitnessActivities = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const activities = await FitnessService.getActivities(userId);
    return res.status(200).json(activities);
  } catch (error: any) {
    console.error('Get Fitness Activities Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFitnessActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const parseResult = FitnessActivitySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const updated = await FitnessService.updateActivity(userId, id, {
      ...parseResult.data,
      activityDate: parseResult.data.activityDate ? new Date(parseResult.data.activityDate) : undefined,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update Fitness Activity Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteFitnessActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await FitnessService.deleteActivity(userId, id);
    return res.status(200).json({ message: 'Fitness activity deleted successfully' });
  } catch (error: any) {
    console.error('Delete Fitness Activity Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getFitnessStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = await FitnessService.getTotalFitnessStats(userId);
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Total Fitness Stats Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
