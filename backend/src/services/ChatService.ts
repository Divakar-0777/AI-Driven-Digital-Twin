import axios from 'axios';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { BudgetRepository } from '../repositories/BudgetRepository';
import { GoalRepository } from '../repositories/GoalRepository';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class ChatService {
  private static async getFullTwinPayload(userId: string) {
    const [profile, transactions, sessions, habits, budgets, goals] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      FinanceRepository.findByUserId(userId),
      StudyRepository.findByUserId(userId),
      HabitRepository.findByUserId(userId),
      BudgetRepository.findByUserId(userId),
      GoalRepository.findByUserId(userId),
    ]);

    // Format fields for Python compatibility
    const formattedTransactions = transactions.map(t => ({
      amount: Number(t.amount),
      category: t.category,
      type: t.type,
      date: t.date.toISOString(),
      paymentMethod: t.paymentMethod,
    }));

    const formattedSessions = sessions.map(s => ({
      duration: s.duration,
      productivityRating: s.productivityRating,
      date: s.date.toISOString(),
      subject: s.subject,
    }));

    const formattedHabits = habits.map(h => ({
      name: h.name,
      completed: h.completed,
      date: h.date.toISOString(),
      targetFrequency: h.targetFrequency,
    }));

    const formattedBudgets = budgets.map(b => ({
      category: b.category,
      monthlyLimit: Number(b.monthlyLimit),
      currentSpending: Number(b.currentSpending),
      period: b.period,
    }));

    const formattedGoals = goals.map(g => ({
      goalName: g.goalName,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      monthlyContribution: Number(g.monthlyContribution),
      targetDate: g.targetDate.toISOString(),
      goalCategory: g.goalCategory,
      status: g.status,
    }));

    return {
      transactions: formattedTransactions,
      sessions: formattedSessions,
      habits: formattedHabits,
      budgets: formattedBudgets,
      goals: formattedGoals,
      monthlyIncome: profile ? Number(profile.monthlyIncome) : 5000.0,
      monthlyExpenseTarget: profile ? Number(profile.monthlyExpenseTarget) : 2500.0,
      dailyStudyHoursTarget: profile ? Number(profile.dailyStudyHoursTarget) : 2.5,
    };
  }

  static async sendMessage(userId: string, query: string, token: string) {
    const twinPayload = await this.getFullTwinPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
      query,
      payload: twinPayload,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}
