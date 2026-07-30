import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { HabitSchema } from '../validators';
import { HabitService } from '../services/HabitService';

export const addHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = HabitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const habit = await HabitService.addHabit(userId, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(201).json(habit);
  } catch (error: any) {
    console.error('Add Habit Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const habits = await HabitService.getHabits(userId);
    return res.status(200).json(habits);
  } catch (error: any) {
    console.error('Get Habits Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const parseResult = HabitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const updated = await HabitService.updateHabit(userId, id, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update Habit Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await HabitService.deleteHabit(userId, id);
    return res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error: any) {
    console.error('Delete Habit Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
