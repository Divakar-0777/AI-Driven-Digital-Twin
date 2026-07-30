import prisma from '../database/prismaClient';

export interface RecommendationInput {
  category: string;
  recommendationText: string;
  impactLevel: string;
  isApplied?: boolean;
}

export class AiRecommendationRepository {
  static async createRecommendation(userId: string, data: RecommendationInput) {
    return prisma.aiRecommendation.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.aiRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.aiRecommendation.findUnique({
      where: { id },
    });
  }

  static async clearUserRecommendations(userId: string) {
    return prisma.aiRecommendation.deleteMany({
      where: { userId },
    });
  }

  static async markAsApplied(id: string, isApplied: boolean = true) {
    return prisma.aiRecommendation.update({
      where: { id },
      data: { isApplied },
    });
  }
}
