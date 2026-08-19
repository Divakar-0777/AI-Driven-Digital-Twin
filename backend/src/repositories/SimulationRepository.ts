import prisma from '../database/prismaClient';

export interface SimulationInput {
  scenarioName: string;
  assumptions: string; // JSON string
  projectedIncome: number;
  projectedExpenses: number;
  projectedSavings: number;
  projectedBalance: number;
  goalImpact?: string | null;
  riskLevel?: string;
}

export class SimulationRepository {
  static async createSimulation(userId: string, data: SimulationInput) {
    return prisma.financialSimulation.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.financialSimulation.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.financialSimulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteSimulation(id: string) {
    return prisma.financialSimulation.delete({
      where: { id },
    });
  }
}
