import prisma from '../database/prismaClient';

export interface FitnessActivityInput {
  activityType: string;
  duration: number;
  caloriesBurned: number;
  activityDate?: Date;
}

export class FitnessRepository {
  static async addActivity(userId: string, data: FitnessActivityInput) {
    return prisma.fitnessActivity.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.fitnessActivity.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.fitnessActivity.findMany({
      where: { userId },
      orderBy: { activityDate: 'desc' },
    });
  }

  static async getAggregateStats(userId: string) {
    return prisma.fitnessActivity.aggregate({
      where: { userId },
      _sum: {
        duration: true,
        caloriesBurned: true,
      },
      _count: {
        id: true,
      },
    });
  }

  static async updateActivity(id: string, data: FitnessActivityInput) {
    return prisma.fitnessActivity.update({
      where: { id },
      data,
    });
  }

  static async deleteActivity(id: string) {
    return prisma.fitnessActivity.delete({
      where: { id },
    });
  }
}
