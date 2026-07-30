import prisma from '../database/prismaClient';

export interface TransactionInput {
  title: string;
  category: string;
  type: string;
  amount: number;
  date?: Date;
  paymentMethod: string;
  notes?: string | null;
}

export class FinanceRepository {
  static async addTransaction(userId: string, data: TransactionInput) {
    return prisma.financialTransaction.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async findById(id: string) {
    return prisma.financialTransaction.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: string) {
    return prisma.financialTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  static async findInDateRange(userId: string, startDate: Date, endDate: Date) {
    return prisma.financialTransaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });
  }

  static async updateTransaction(id: string, data: TransactionInput) {
    return prisma.financialTransaction.update({
      where: { id },
      data,
    });
  }

  static async deleteTransaction(id: string) {
    return prisma.financialTransaction.delete({
      where: { id },
    });
  }
}
