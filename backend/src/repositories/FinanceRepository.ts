import prisma from '../database/prismaClient';

export interface TransactionInput {
  title: string;
  category: string;
  type: string;
  amount: number;
  date?: Date;
  paymentMethod: string;
  notes?: string | null;
  recurring?: boolean;
  recurrenceFrequency?: string | null;
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

  static async bulkAddTransactions(userId: string, data: TransactionInput[]) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of data) {
        const dateVal = item.date ? new Date(item.date) : new Date();
        const start = new Date(dateVal.getTime() - 60000);
        const end = new Date(dateVal.getTime() + 60000);
        
        const existing = await tx.financialTransaction.findFirst({
          where: {
            userId,
            title: item.title,
            amount: item.amount,
            type: item.type,
            date: {
              gte: start,
              lte: end
            }
          }
        });

        if (!existing) {
          const created = await tx.financialTransaction.create({
            data: {
              userId,
              ...item,
            }
          });
          results.push(created);
        }
      }
      return results;
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
      orderBy: { date: 'asc' },
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
