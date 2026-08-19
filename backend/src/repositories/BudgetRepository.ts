import prisma from '../database/prismaClient';

export interface BudgetInput {
  category: string;
  monthlyLimit: number;
  currentSpending?: number;
  period?: string;
  status?: string;
}

export class BudgetRepository {
  static async createBudget(userId: string, data: BudgetInput) {
    return prisma.budget.create({
      data: {
        userId,
        category: data.category,
        monthlyLimit: data.monthlyLimit,
        currentSpending: data.currentSpending || 0,
        period: data.period || 'MONTHLY',
        status: data.status || 'ACTIVE',
      },
    });
  }

  static async findById(id: string) {
    return prisma.budget.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });
  }

  static async findByUserAndCategory(userId: string, category: string) {
    return prisma.budget.findFirst({
      where: { userId, category },
    });
  }

  static async updateBudget(id: string, data: Partial<BudgetInput>) {
    return prisma.budget.update({
      where: { id },
      data,
    });
  }

  static async deleteBudget(id: string) {
    return prisma.budget.delete({
      where: { id },
    });
  }
}
