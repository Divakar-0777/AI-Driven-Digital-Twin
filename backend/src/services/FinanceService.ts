import { FinanceRepository, TransactionInput } from '../repositories/FinanceRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DigitalTwinService } from './DigitalTwinService';
import { AiRecommendationService } from './AiRecommendationService';
import { ProfileRepository } from '../repositories/ProfileRepository';
import prisma from '../database/prismaClient';

export class FinanceService {
  static async addTransaction(userId: string, data: TransactionInput) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.create({
        data: {
          userId,
          ...data,
        },
      });

      await tx.activityHistory.create({
        data: {
          userId,
          activityType: 'Transaction Added',
          description: `Added transaction "${data.title}" (${data.type}) of amount $${data.amount}`,
        },
      });

      // Post-sync hook
      await DigitalTwinService.recalculateTwinState(userId);
      await AiRecommendationService.generateRecommendations(userId);

      // Check if expense exceeds limit and notify
      const profile = await ProfileRepository.findByUserId(userId);
      if (profile && data.type === 'EXPENSE') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

        const txs = await FinanceRepository.findInDateRange(userId, startOfMonth, endOfMonth);
        let totalExpense = 0;
        txs.forEach(t => {
          if (t.type === 'EXPENSE') totalExpense += Number(t.amount);
        });

        const target = Number(profile.monthlyExpenseTarget);
        if (totalExpense > target && target > 0) {
          await tx.notification.create({
            data: {
              userId,
              title: 'Budget Alert',
              message: `Your total monthly expenses ($${totalExpense.toFixed(2)}) have exceeded your target budget ($${target.toFixed(2)})!`,
              type: 'ALERT',
            },
          });
        }
      }

      return transaction;
    });
  }

  static async getTransactions(userId: string) {
    return FinanceRepository.findByUserId(userId);
  }

  static async updateTransaction(userId: string, id: string, data: TransactionInput) {
    const transaction = await FinanceRepository.findById(id);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.userId !== userId) throw new Error('Access denied');

    const updated = await FinanceRepository.updateTransaction(id, data);
    await ActivityRepository.logActivity(userId, 'Transaction Updated', `Updated transaction "${data.title}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);

    return updated;
  }

  static async deleteTransaction(userId: string, id: string) {
    const transaction = await FinanceRepository.findById(id);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.userId !== userId) throw new Error('Access denied');

    await FinanceRepository.deleteTransaction(id);
    await ActivityRepository.logActivity(userId, 'Transaction Deleted', `Deleted transaction "${transaction.title}"`);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);
  }

  static async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const profile = await ProfileRepository.findByUserId(userId);
    const target = profile ? Number(profile.monthlyExpenseTarget) : 0;

    const transactions = await FinanceRepository.findInDateRange(userId, startDate, endDate);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      const isIncome = tx.type === 'INCOME';

      if (isIncome) {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      if (!categoryBreakdown[tx.category]) {
        categoryBreakdown[tx.category] = { income: 0, expense: 0 };
      }

      if (isIncome) {
        categoryBreakdown[tx.category].income += amt;
      } else {
        categoryBreakdown[tx.category].expense += amt;
      }
    });

    return {
      year,
      month,
      monthlyExpenseTarget: target,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      expenseVsTargetStatus: totalExpense > target ? 'OVER_BUDGET' : 'WITHIN_BUDGET',
      categoryBreakdown,
    };
  }
}
