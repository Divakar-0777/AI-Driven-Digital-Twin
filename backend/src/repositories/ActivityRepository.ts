import prisma from '../database/prismaClient';

export class ActivityRepository {
  static async logActivity(userId: string, activityType: string, description: string) {
    return prisma.activityHistory.create({
      data: {
        userId,
        activityType,
        description,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.activityHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
