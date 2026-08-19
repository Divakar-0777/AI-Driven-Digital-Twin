import prisma from '../database/prismaClient';

export interface GoalInput {
  goalName: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution?: number;
  targetDate: Date;
  priority?: string;
  goalCategory: string;
  status?: string;
}

export class GoalRepository {
  static async createGoal(userId: string, data: GoalInput) {
    return prisma.financialGoal.create({
      data: {
        userId,
        goalName: data.goalName,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        monthlyContribution: data.monthlyContribution || 0,
        targetDate: data.targetDate,
        priority: data.priority || 'MEDIUM',
        goalCategory: data.goalCategory,
        status: data.status || 'ACTIVE',
      },
    });
  }

  static async findById(id: string) {
    return prisma.financialGoal.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' },
    });
  }

  static async updateGoal(id: string, data: Partial<GoalInput>) {
    return prisma.financialGoal.update({
      where: { id },
      data,
    });
  }

  static async deleteGoal(id: string) {
    return prisma.financialGoal.delete({
      where: { id },
    });
  }
}
