import { HabitRepository, HabitInput } from '../repositories/HabitRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DigitalTwinService } from './DigitalTwinService';
import { AiRecommendationService } from './AiRecommendationService';
import prisma from '../database/prismaClient';

export class HabitService {
  static async addHabit(userId: string, data: HabitInput) {
    return prisma.$transaction(async (tx) => {
      const habit = await tx.habit.create({
        data: {
          userId,
          ...data,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Habit Added',
          description: `Added habit "${data.name}" with frequency "${data.targetFrequency}"`,
        },
      });

      await DigitalTwinService.recalculateTwinState(userId);
      await AiRecommendationService.generateRecommendations(userId);

      return habit;
    });
  }

  static async getHabits(userId: string) {
    return HabitRepository.findByUserId(userId);
  }

  static async updateHabit(userId: string, id: string, data: HabitInput) {
    const habit = await HabitRepository.findById(id);
    if (!habit) throw new Error('Habit not found');
    if (habit.userId !== userId) throw new Error('Access denied');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.habit.update({
        where: { id },
        data,
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Habit Updated',
          description: `Updated habit "${data.name}"`,
        },
      });

      if (data.completed && !habit.completed) {
        await tx.activityHistory.create({
          data: {
            userId,
            activityType: 'Habit Completed',
            description: `Completed habit "${data.name}"`,
          },
        });
      }

      return res;
    });

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);

    return updated;
  }

  static async deleteHabit(userId: string, id: string) {
    const habit = await HabitRepository.findById(id);
    if (!habit) throw new Error('Habit not found');
    if (habit.userId !== userId) throw new Error('Access denied');

    await HabitRepository.deleteHabit(id);
    await ActivityRepository.logActivity(userId, 'Habit Deleted', `Deleted habit "${habit.name}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);
  }
}
