import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FinancialTransactionSchema } from '../validators';
import { FinanceService } from '../services/FinanceService';

export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = FinancialTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const transaction = await FinanceService.addTransaction(userId, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Add Transaction Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const transactions = await FinanceService.getTransactions(userId);
    return res.status(200).json(transactions);
  } catch (error: any) {
    console.error('Get Transactions Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const parseResult = FinancialTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const updated = await FinanceService.updateTransaction(userId, id, {
      ...parseResult.data,
      date: parseResult.data.date ? new Date(parseResult.data.date) : undefined,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update Transaction Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await FinanceService.deleteTransaction(userId, id);
    return res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete Transaction Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getMonthlySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const yearQuery = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const monthQuery = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1; // 1-12

    const summary = await FinanceService.getMonthlySummary(userId, yearQuery, monthQuery);
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error('Monthly Summary Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
