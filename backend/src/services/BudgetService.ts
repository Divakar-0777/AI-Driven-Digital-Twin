import { BudgetRepository, BudgetInput } from '../repositories/BudgetRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class BudgetService {
  static async createOrUpdateBudget(userId: string, data: BudgetInput) {
    const existing = await BudgetRepository.findByUserAndCategory(userId, data.category);
    
    // Compute dynamic spending for the current month
    const spending = await this.calculateCategorySpending(userId, data.category);
    
    if (existing) {
      const updated = await BudgetRepository.updateBudget(existing.id, {
        monthlyLimit: data.monthlyLimit,
        currentSpending: spending,
      });
      await ActivityRepository.logActivity(userId, 'Budget Updated', `Updated monthly limit for category "${data.category}" to $${data.monthlyLimit}`);
      return updated;
    }

    const created = await BudgetRepository.createBudget(userId, {
      ...data,
      currentSpending: spending,
    });
    await ActivityRepository.logActivity(userId, 'Budget Created', `Set a monthly limit of $${data.monthlyLimit} for category "${data.category}"`);
    return created;
  }

  static async getBudgets(userId: string) {
    const budgets = await BudgetRepository.findByUserId(userId);
    // Refresh currentSpending for each budget
    const refreshed = await Promise.all(
      budgets.map(async (budget) => {
        const currentSpending = await this.calculateCategorySpending(userId, budget.category);
        if (Number(budget.currentSpending) !== currentSpending) {
          return BudgetRepository.updateBudget(budget.id, { currentSpending });
        }
        return budget;
      })
    );
    return refreshed;
  }

  static async deleteBudget(userId: string, id: string) {
    const budget = await BudgetRepository.findById(id);
    if (!budget) throw new Error('Budget not found');
    if (budget.userId !== userId) throw new Error('Access denied');

    await BudgetRepository.deleteBudget(id);
    await ActivityRepository.logActivity(userId, 'Budget Deleted', `Deleted budget limit for category "${budget.category}"`);
  }

  static async calculateCategorySpending(userId: string, category: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);

    const transactions = await FinanceRepository.findInDateRange(userId, startOfMonth, endOfMonth);
    
    const sum = transactions
      .filter((tx) => tx.type === 'EXPENSE' && tx.category.toLowerCase() === category.toLowerCase())
      .reduce((acc, tx) => acc + Number(tx.amount), 0);

    return Number(sum.toFixed(2));
  }
}
