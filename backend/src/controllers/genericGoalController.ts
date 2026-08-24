import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GoalService } from '../services/GoalService';

export const createGenericGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { goalName, description, goalType, targetValue, currentValue, unit, deadline, priority, status } = req.body;

    if (!goalName || !goalType || targetValue === undefined) {
      return res.status(400).json({ error: 'goalName, goalType, and targetValue are required' });
    }

    const goal = await GoalService.createGenericGoal(userId, {
      goalName,
      description: description || null,
      goalType,
      targetValue: Number(targetValue),
      currentValue: Number(currentValue || 0),
      unit: unit || null,
      deadline: deadline ? new Date(deadline) : null,
      priority: priority || 'MEDIUM',
      status: status || 'ACTIVE',
    });
    return res.status(201).json(goal);
  } catch (error: any) {
    console.error('Create Generic Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getGenericGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const goals = await GoalService.getGenericGoals(userId);
    return res.status(200).json(goals);
  } catch (error: any) {
    console.error('Get Generic Goals Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateGenericGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const goal = await GoalService.updateGenericGoal(userId, id, req.body);
    return res.status(200).json(goal);
  } catch (error: any) {
    console.error('Update Generic Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteGenericGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    await GoalService.deleteGenericGoal(userId, id);
    return res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('Delete Generic Goal Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
