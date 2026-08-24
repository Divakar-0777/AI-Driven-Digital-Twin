import prisma from '../database/prismaClient';

export class BudgetRepository {
  private static serializeBudget(budget: any) {
    return {
      ...budget,
      monthlyLimit: Number(budget.monthlyLimit),
      currentSpending: Number(budget.currentSpending),
    };
  }

  static async findByUserId(userId: string) {
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((budget) => this.serializeBudget(budget));
  }

  static async findById(id: string) {
    const budget = await prisma.budget.findUnique({
      where: { id },
    });

    return budget ? this.serializeBudget(budget) : null;
  }

  static async createBudget(data: {
    userId: string;
    category: string;
    monthlyLimit: number;
  }) {
    const budget = await prisma.budget.create({
      data: {
        userId: data.userId,
        category: data.category,
        monthlyLimit: data.monthlyLimit,
        currentSpending: 0,
      },
    });

    return this.serializeBudget(budget);
  }

  static async updateBudget(
    id: string,
    data: {
      category?: string;
      monthlyLimit?: number;
      currentSpending?: number;
    }
  ) {
    const budget = await prisma.budget.update({
      where: { id },
      data,
    });

    return this.serializeBudget(budget);
  }

  static async deleteBudget(id: string) {
    return prisma.budget.delete({
      where: { id },
    });
  }
}