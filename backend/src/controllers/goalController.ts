import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GoalSchema } from '../validators';
import { GoalService } from '../services/GoalService';

export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = GoalSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const goal = await GoalService.createGoal(userId, {
      ...parseResult.data,
      targetDate: new Date(parseResult.data.targetDate),
    });
    return res.status(201).json(goal);
  } catch (error: any) {
    console.error('Create Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const goals = await GoalService.getGoals(userId);
    return res.status(200).json(goals);
  } catch (error: any) {
    console.error('Get Goals Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const parseResult = GoalSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const goalData = { ...parseResult.data };
    if (goalData.targetDate) {
      goalData.targetDate = new Date(goalData.targetDate) as any;
    }

    const updated = await GoalService.updateGoal(userId, id, goalData as any);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await GoalService.deleteGoal(userId, id);
    return res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
