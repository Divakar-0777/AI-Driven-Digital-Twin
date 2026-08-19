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

export const exportTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const transactions = await FinanceService.getTransactions(userId);
    
    if (format === 'csv') {
      let csvContent = 'date,title,amount,type,category,paymentMethod,notes,recurring,recurrenceFrequency\n';
      transactions.forEach((tx) => {
        const row = [
          tx.date.toISOString(),
          `"${tx.title.replace(/"/g, '""')}"`,
          tx.amount.toString(),
          tx.type,
          `"${tx.category.replace(/"/g, '""')}"`,
          `"${tx.paymentMethod.replace(/"/g, '""')}"`,
          `"${(tx.notes || '').replace(/"/g, '""')}"`,
          tx.recurring ? 'true' : 'false',
          tx.recurrenceFrequency || '',
        ].join(',');
        csvContent += row + '\n';
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.status(200).send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
      return res.status(200).json(transactions);
    }
  } catch (error: any) {
    console.error('Export Error:', error);
    return res.status(500).json({ error: 'Failed to export transactions' });
  }
};

export const importTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { csvText } = req.body;
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'csvText is required in body' });
    }

    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV is empty or lacks headers' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"'));
      if (row.length < 5) continue;
      
      const obj: any = {};
      headers.forEach((h, index) => {
        if (row[index] !== undefined) {
          obj[h] = row[index];
        }
      });

      const title = obj.title || 'Imported Transaction';
      const category = obj.category || 'Other';
      const type = (obj.type || 'EXPENSE').toUpperCase();
      if (type !== 'INCOME' && type !== 'EXPENSE') continue;
      
      const amount = parseFloat(obj.amount);
      if (isNaN(amount) || amount <= 0) continue;

      const date = obj.date ? new Date(obj.date) : new Date();
      if (isNaN(date.getTime())) continue;

      const paymentMethod = obj.paymentMethod || 'Other';
      const notes = obj.notes || null;
      const recurring = obj.recurring === 'true' || obj.recurring === '1';
      const recurrenceFrequency = obj.recurrenceFrequency || null;

      records.push({
        title,
        category,
        type,
        amount,
        date,
        paymentMethod,
        notes,
        recurring,
        recurrenceFrequency,
      });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'No valid records found in CSV' });
    }

    const { FinanceRepository } = await import('../repositories/FinanceRepository');
    const { DigitalTwinService } = await import('../services/DigitalTwinService');
    const { AiRecommendationService } = await import('../services/AiRecommendationService');
    
    const created = await FinanceRepository.bulkAddTransactions(userId, records);

    await DigitalTwinService.recalculateTwinState(userId);
    await AiRecommendationService.generateRecommendations(userId);

    return res.status(201).json({ message: `Successfully imported ${created.length} transactions`, count: created.length });
  } catch (error: any) {
    console.error('Import Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
