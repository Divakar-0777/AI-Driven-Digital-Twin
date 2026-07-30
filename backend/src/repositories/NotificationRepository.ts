import prisma from '../database/prismaClient';

export interface NotificationInput {
  title: string;
  message: string;
  type: string;
}

export class NotificationRepository {
  static async createNotification(userId: string, data: NotificationInput) {
    return prisma.notification.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async deleteNotification(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }
}
