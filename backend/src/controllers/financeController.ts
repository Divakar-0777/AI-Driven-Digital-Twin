import { Response } from 'express';
import prisma from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { FinancialTransactionSchema } from '../validators';
import { logActivity } from '../utils/activity';

export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = FinancialTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { title, category, type, amount, date, paymentMethod, notes } = parseResult.data;

    const transaction = await prisma.financialTransaction.create({
      data: {
        userId,
        title,
        category,
        type,
        amount,
        date: new Date(date),
        paymentMethod,
        notes,
      },
    });

    await logActivity(
      userId,
      'Transaction Added',
      `Added transaction "${title}" (${type}) of amount $${amount}`
    );

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Add Transaction Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const transactions = await prisma.financialTransaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Get Transactions Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parseResult = FinancialTransactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const { title, category, type, amount, date, paymentMethod, notes } = parseResult.data;

    const updated = await prisma.financialTransaction.update({
      where: { id },
      data: {
        title,
        category,
        type,
        amount,
        date: new Date(date),
        paymentMethod,
        notes,
      },
    });

    await logActivity(
      userId,
      'Transaction Updated',
      `Updated transaction "${title}" (${type})`
    );

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update Transaction Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.financialTransaction.delete({
      where: { id },
    });

    await logActivity(
      userId,
      'Transaction Deleted',
      `Deleted transaction "${transaction.title}"`
    );

    return res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete Transaction Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMonthlySummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const yearQuery = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const monthQuery = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1; // 1-12

    // Set ranges
    const startDate = new Date(yearQuery, monthQuery - 1, 1);
    const endDate = new Date(yearQuery, monthQuery, 1); // Excludes next month's start

    // Fetch user details for monthly target
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyExpenseTarget: true },
    });

    const target = user ? Number(user.monthlyExpenseTarget) : 0;

    // Fetch transactions in date range
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

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

    return res.status(200).json({
      year: yearQuery,
      month: monthQuery,
      monthlyExpenseTarget: target,
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      expenseVsTargetStatus: totalExpense > target ? 'OVER_BUDGET' : 'WITHIN_BUDGET',
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Monthly Summary Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
