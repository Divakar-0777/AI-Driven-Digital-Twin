import prisma from '../database/prismaClient';

export interface DecisionSimulationInput {
  decision: string; // JSON string
  baseline: string; // JSON string
  scenarios: string; // JSON string
  assumptions: string; // JSON string
  outcomes: string; // JSON string
  comparison: string; // JSON string
  recommendation: string; // JSON string
}

export class DecisionSimulationRepository {
  static async create(userId: string, data: DecisionSimulationInput) {
    return prisma.decisionSimulation.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.decisionSimulation.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.decisionSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async delete(id: string) {
    return prisma.decisionSimulation.delete({
      where: { id },
    });
  }
}
