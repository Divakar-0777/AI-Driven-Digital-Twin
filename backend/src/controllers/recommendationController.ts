import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiRecommendationService } from '../services/AiRecommendationService';
import axios from 'axios';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { GoalRepository } from '../repositories/GoalRepository';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const recommendations = await AiRecommendationService.getRecommendations(userId);
    return res.status(200).json(recommendations);
  } catch (error: any) {
    console.error('Get Recommendations Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const applyRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await AiRecommendationService.applyRecommendation(id);
    return res.status(200).json({ message: 'Recommendation marked as applied', recommendation: updated });
  } catch (error: any) {
    console.error('Apply Recommendation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getRecommendationsV2 = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.split(' ')[1] || '';

    const [profile, transactions, sessions, habits, goals] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      FinanceRepository.findByUserId(userId),
      StudyRepository.findByUserId(userId),
      HabitRepository.findByUserId(userId),
      GoalRepository.findByUserId(userId),
    ]);

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/recommend`, {
        profile: {
          monthlyIncome: profile ? Number(profile.monthlyIncome) : 5000,
          monthlyExpenseTarget: profile ? Number(profile.monthlyExpenseTarget) : 2500,
          dailyStudyHoursTarget: profile ? Number(profile.dailyStudyHoursTarget) : 2.5,
        },
        transactions: transactions.map(t => ({
          amount: Number(t.amount), category: t.category, type: t.type,
          date: t.date.toISOString(), paymentMethod: t.paymentMethod,
        })),
        sessions: sessions.map(s => ({
          duration: s.duration, productivityRating: s.productivityRating,
          date: s.date.toISOString(), subject: s.subject,
        })),
        habits: habits.map(h => ({
          name: h.name, completed: h.completed,
          date: h.date.toISOString(), targetFrequency: h.targetFrequency,
        })),
        goals: goals.map(g => ({
          goalName: g.goalName, targetAmount: Number(g.targetAmount),
          currentAmount: Number(g.currentAmount), monthlyContribution: Number(g.monthlyContribution),
          targetDate: g.targetDate.toISOString(), goalCategory: g.goalCategory, status: g.status,
        })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      return res.status(200).json(response.data);
    } catch (aiError: any) {
      // Fallback to database recommendations
      const recommendations = await AiRecommendationService.getRecommendations(userId);
      return res.status(200).json({ recommendations, mode: 'database' });
    }
  } catch (error: any) {
    console.error('Get Recommendations V2 Error:', error);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};
