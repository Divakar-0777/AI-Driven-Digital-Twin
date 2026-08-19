import { FinanceRepository, TransactionInput } from '../repositories/FinanceRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import { DigitalTwinService } from './DigitalTwinService';
import { AiRecommendationService } from './AiRecommendationService';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { BudgetService } from './BudgetService';
import prisma from '../database/prismaClient';

export class FinanceService {
  static async addTransaction(userId: string, data: TransactionInput) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.create({
        data: {
          userId,
          title: data.title,
          category: data.category,
          type: data.type,
          amount: data.amount,
          date: data.date,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          recurring: data.recurring || false,
          recurrenceFrequency: data.recurrenceFrequency || null,
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

      // Check overall monthly expense budget limit and notify
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
          // Check if alert already exists for this month to avoid duplicates
          const existingAlert = await tx.notification.findFirst({
            where: {
              userId,
              type: 'ALERT',
              title: 'Budget Alert',
              createdAt: {
                gte: startOfMonth,
                lt: endOfMonth,
              },
            },
          });

          if (!existingAlert) {
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
      }

      // Check category-specific budget limits and notify
      if (data.type === 'EXPENSE') {
        const budget = await tx.budget.findFirst({
          where: { userId, category: { equals: data.category, mode: 'insensitive' } },
        });

        if (budget) {
          const limit = Number(budget.monthlyLimit);
          if (limit > 0) {
            // Calculate dynamic spending
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

            const txs = await tx.financialTransaction.findMany({
              where: {
                userId,
                category: { equals: data.category, mode: 'insensitive' },
                type: 'EXPENSE',
                date: {
                  gte: startOfMonth,
                  lt: endOfMonth,
                },
              },
            });

            const spending = txs.reduce((acc, t) => acc + Number(t.amount), 0);
            const ratio = spending / limit;
            const prevSpending = spending - Number(data.amount);
            const prevRatio = prevSpending / limit;

            let notifyMessage = '';
            let notifyType = 'INFO';

            if (spending >= limit && prevSpending < limit) {
              notifyMessage = `Your spending in "${data.category}" ($${spending.toFixed(2)}) has exceeded your category budget limit of $${limit.toFixed(2)}!`;
              notifyType = 'ALERT';
            } else if (ratio >= 0.9 && prevRatio < 0.9) {
              notifyMessage = `Your spending in "${data.category}" has reached 90% of your $${limit.toFixed(2)} budget.`;
              notifyType = 'ALERT';
            } else if (ratio >= 0.75 && prevRatio < 0.75) {
              notifyMessage = `Your spending in "${data.category}" has reached 75% of your $${limit.toFixed(2)} budget.`;
            } else if (ratio >= 0.5 && prevRatio < 0.5) {
              notifyMessage = `Your spending in "${data.category}" has reached 50% of your $${limit.toFixed(2)} budget.`;
            }

            if (notifyMessage) {
              await tx.notification.create({
                data: {
                  userId,
                  title: `Budget Alert: ${budget.category}`,
                  message: notifyMessage,
                  type: notifyType,
                },
              });
            }

            // Sync budget current spending
            await tx.budget.update({
              where: { id: budget.id },
              data: { currentSpending: spending },
            });
          }
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

    // Refresh budgets spending
    const budgets = await BudgetRepository.findByUserId(userId);
    for (const b of budgets) {
      const spending = await BudgetService.calculateCategorySpending(userId, b.category);
      await BudgetRepository.updateBudget(b.id, { currentSpending: spending });
    }

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

    // Refresh budgets spending
    const budgets = await BudgetRepository.findByUserId(userId);
    for (const b of budgets) {
      const spending = await BudgetService.calculateCategorySpending(userId, b.category);
      await BudgetRepository.updateBudget(b.id, { currentSpending: spending });
    }
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
