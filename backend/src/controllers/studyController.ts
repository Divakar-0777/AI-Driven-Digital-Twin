import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StudySessionSchema } from '../validators';
import { StudyService } from '../services/StudyService';

export const addStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = StudySessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const session = await StudyService.addSession(userId, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(201).json(session);
  } catch (error: any) {
    console.error('Add Study Session Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getStudySessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessions = await StudyService.getSessions(userId);
    return res.status(200).json(sessions);
  } catch (error: any) {
    console.error('Get Study Sessions Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const parseResult = StudySessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const updated = await StudyService.updateSession(userId, id, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update Study Session Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await StudyService.deleteSession(userId, id);
    return res.status(200).json({ message: 'Study session deleted successfully' });
  } catch (error: any) {
    console.error('Delete Study Session Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getTotalStudyHours = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const stats = await StudyService.getTotalStudyHours(userId);
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error('Total Study Hours Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
