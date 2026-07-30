import prisma from '../database/prismaClient';

export interface StudySessionInput {
  subject: string;
  topic: string;
  duration: number;
  date?: Date;
  productivityRating: number;
  notes?: string | null;
}

export class StudyRepository {
  static async addSession(userId: string, data: StudySessionInput) {
    return prisma.studySession.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.studySession.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.studySession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async getAggregateStats(userId: string) {
    return prisma.studySession.aggregate({
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
  }

  static async updateSession(id: string, data: StudySessionInput) {
    return prisma.studySession.update({
      where: { id },
      data,
    });
  }

  static async deleteSession(id: string) {
    return prisma.studySession.delete({
      where: { id },
    });
  }
}
