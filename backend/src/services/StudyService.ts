import { StudyRepository, StudySessionInput } from '../repositories/StudyRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DigitalTwinService } from './DigitalTwinService';
import { AiRecommendationService } from './AiRecommendationService';
import prisma from '../database/prismaClient';

export class StudyService {
  static async addSession(userId: string, data: StudySessionInput) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.studySession.create({
        data: {
          userId,
          ...data,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Study Session Added',
          description: `Logged study session for "${data.subject}" - "${data.topic}" (${data.duration} mins)`,
        },
      });

      // Post-sync hook
      await DigitalTwinService.recalculateTwinState(userId);
      await AiRecommendationService.generateRecommendations(userId);

      return session;
    });
  }

  static async getSessions(userId: string) {
    return StudyRepository.findByUserId(userId);
  }

  static async updateSession(userId: string, id: string, data: StudySessionInput) {
    const session = await StudyRepository.findById(id);
    if (!session) throw new Error('Study session not found');
    if (session.userId !== userId) throw new Error('Access denied');

    const updated = await StudyRepository.updateSession(id, data);
    await ActivityRepository.logActivity(userId, 'Study Session Updated', `Updated study session for "${data.subject}" - "${data.topic}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);

    return updated;
  }

  static async deleteSession(userId: string, id: string) {
    const session = await StudyRepository.findById(id);
    if (!session) throw new Error('Study session not found');
    if (session.userId !== userId) throw new Error('Access denied');

    await StudyRepository.deleteSession(id);
    await ActivityRepository.logActivity(userId, 'Study Session Deleted', `Deleted study session for "${session.subject}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);
  }

  static async getTotalStudyHours(userId: string) {
    const stats = await StudyRepository.getAggregateStats(userId);
    const totalMinutes = stats._sum.duration || 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const sessionCount = stats._count.id || 0;
    const averageProductivity = stats._avg.productivityRating
      ? Math.round(stats._avg.productivityRating * 10) / 10
      : 0;

    return {
      totalMinutes,
      totalHours,
      sessionCount,
      averageProductivity,
    };
  }
}
