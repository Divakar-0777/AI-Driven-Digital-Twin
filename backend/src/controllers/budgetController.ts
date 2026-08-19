import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BudgetSchema } from '../validators';
import { BudgetService } from '../services/BudgetService';

export const createBudget = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = BudgetSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const budget = await BudgetService.createOrUpdateBudget(userId, parseResult.data);
    return res.status(201).json(budget);
  } catch (error: any) {
    console.error('Create Budget Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const budgets = await BudgetService.getBudgets(userId);
    return res.status(200).json(budgets);
  } catch (error: any) {
    console.error('Get Budgets Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await BudgetService.deleteBudget(userId, id);
    return res.status(200).json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    console.error('Delete Budget Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
