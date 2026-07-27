import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { HabitSchema } from '../validators';
import { logActivity } from '../utils/activity';

export const addHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = HabitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { name, targetFrequency, completed, date } = parseResult.data;

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        targetFrequency,
        completed,
        date: new Date(date),
      },
    });

    await logActivity(userId, 'Habit Added', `Added habit "${name}" with target frequency "${targetFrequency}"`);

    if (completed) {
      await logActivity(userId, 'Habit Completed', `Completed habit "${name}"`);
    }

    return res.status(201).json(habit);
  } catch (error) {
    console.error('Add Habit Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return res.status(200).json(habits);
  } catch (error) {
    console.error('Get Habits Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habit.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parseResult = HabitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { name, targetFrequency, completed, date } = parseResult.data;

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        name,
        targetFrequency,
        completed,
        date: new Date(date),
      },
    });

    await logActivity(userId, 'Habit Updated', `Updated habit "${name}"`);

    // Log completion state change
    if (completed && !habit.completed) {
      await logActivity(userId, 'Habit Completed', `Completed habit "${name}"`);
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update Habit Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    if (habit.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.habit.delete({
      where: { id },
    });

    await logActivity(userId, 'Habit Deleted', `Deleted habit "${habit.name}"`);

    return res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete Habit Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
