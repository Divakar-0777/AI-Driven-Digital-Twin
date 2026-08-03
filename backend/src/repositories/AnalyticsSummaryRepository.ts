import prisma from '../database/prismaClient';

export interface AnalyticsSummaryInput {
  financialHealthScore: number;
  productivityScore: number;
  habitScore: number;
  overallAIScore: number;
}

export class AnalyticsSummaryRepository {
  static async upsertSummary(userId: string, data: AnalyticsSummaryInput) {
    return prisma.analyticsSummary.upsert({
      where: { userId },
      update: {
        financialHealthScore: data.financialHealthScore,
        productivityScore: data.productivityScore,
        habitScore: data.habitScore,
        overallAIScore: data.overallAIScore,
      },
      create: {
        userId,
        financialHealthScore: data.financialHealthScore,
        productivityScore: data.productivityScore,
        habitScore: data.habitScore,
        overallAIScore: data.overallAIScore,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.analyticsSummary.findUnique({
      where: { userId },
    });
  }
}
