import prisma from '../database/prismaClient';

export interface PredictionHistoryInput {
  predictionType: string;
  predictionResult: any;
  confidenceScore: number;
}

export class PredictionHistoryRepository {
  static async addPrediction(userId: string, data: PredictionHistoryInput) {
    return prisma.predictionHistory.create({
      data: {
        userId,
        predictionType: data.predictionType,
        predictionResult: data.predictionResult,
        confidenceScore: data.confidenceScore,
      },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.predictionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findLatestByUserId(userId: string, predictionType: string) {
    return prisma.predictionHistory.findFirst({
      where: { userId, predictionType },
      orderBy: { createdAt: 'desc' },
    });
  }
}
