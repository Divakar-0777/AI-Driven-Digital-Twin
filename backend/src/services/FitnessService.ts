import { FitnessRepository, FitnessActivityInput } from '../repositories/FitnessRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DigitalTwinService } from './DigitalTwinService';
import { AiRecommendationService } from './AiRecommendationService';
import prisma from '../database/prismaClient';

export class FitnessService {
  static async addActivity(userId: string, data: FitnessActivityInput) {
    return prisma.$transaction(async (tx) => {
      const activity = await tx.fitnessActivity.create({
        data: {
          userId,
          ...data,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Fitness Activity Added',
          description: `Logged fitness activity "${data.activityType}" (${data.duration} mins, ${data.caloriesBurned} kcal)`,
        },
      });

      // Post-sync hook
      await DigitalTwinService.recalculateTwinState(userId);
      await AiRecommendationService.generateRecommendations(userId);

      return activity;
    });
  }

  static async getActivities(userId: string) {
    return FitnessRepository.findByUserId(userId);
  }

  static async updateActivity(userId: string, id: string, data: FitnessActivityInput) {
    const activity = await FitnessRepository.findById(id);
    if (!activity) throw new Error('Fitness activity not found');
    if (activity.userId !== userId) throw new Error('Access denied');

    const updated = await FitnessRepository.updateActivity(id, data);
    await ActivityRepository.logActivity(userId, 'Fitness Activity Updated', `Updated fitness activity "${data.activityType}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);

    return updated;
  }

  static async deleteActivity(userId: string, id: string) {
    const activity = await FitnessRepository.findById(id);
    if (!activity) throw new Error('Fitness activity not found');
    if (activity.userId !== userId) throw new Error('Access denied');

    await FitnessRepository.deleteActivity(id);
    await ActivityRepository.logActivity(userId, 'Fitness Activity Deleted', `Deleted fitness activity "${activity.activityType}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);
  }

  static async getTotalFitnessStats(userId: string) {
    const stats = await FitnessRepository.getAggregateStats(userId);
    const totalMinutes = stats._sum.duration || 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
    const totalCaloriesBurned = stats._sum.caloriesBurned || 0;
    const activityCount = stats._count.id || 0;

    return {
      totalMinutes,
      totalHours,
      totalCaloriesBurned,
      activityCount,
    };
  }
}
