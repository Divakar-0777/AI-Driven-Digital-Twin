import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { StudySessionSchema } from '../validators';
import { logActivity } from '../utils/activity';

export const addStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = StudySessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { subject, topic, duration, date, productivityRating, notes } = parseResult.data;

    const session = await prisma.studySession.create({
      data: {
        userId,
        subject,
        topic,
        duration,
        date: new Date(date),
        productivityRating,
        notes,
      },
    });

    await logActivity(
      userId,
      'Study Session Added',
      `Logged study session for "${subject}" - "${topic}" (${duration} mins)`
    );

    return res.status(201).json(session);
  } catch (error) {
    console.error('Add Study Session Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getStudySessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Get Study Sessions Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const session = await prisma.studySession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parseResult = StudySessionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { subject, topic, duration, date, productivityRating, notes } = parseResult.data;

    const updated = await prisma.studySession.update({
      where: { id },
      data: {
        subject,
        topic,
        duration,
        date: new Date(date),
        productivityRating,
        notes,
      },
    });

    await logActivity(
      userId,
      'Study Session Updated',
      `Updated study session for "${subject}" - "${topic}"`
    );

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update Study Session Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteStudySession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const session = await prisma.studySession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.studySession.delete({
      where: { id },
    });

    await logActivity(
      userId,
      'Study Session Deleted',
      `Deleted study session for "${session.subject}"`
    );

    return res.status(200).json({ message: 'Study session deleted successfully' });
  } catch (error) {
    console.error('Delete Study Session Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTotalStudyHours = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const aggregation = await prisma.studySession.aggregate({
      where: { userId },
      _sum: {
        duration: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        productivityRating: true,
      },
    });

    const totalMinutes = aggregation._sum.duration || 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const sessionCount = aggregation._count.id || 0;
    const averageProductivity = aggregation._avg.productivityRating
      ? Math.round(aggregation._avg.productivityRating * 10) / 10
      : 0;

    return res.status(200).json({
      totalMinutes,
      totalHours,
      sessionCount,
      averageProductivity,
    });
  } catch (error) {
    console.error('Total Study Hours Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
