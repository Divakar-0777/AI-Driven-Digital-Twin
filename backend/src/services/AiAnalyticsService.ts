import axios from 'axios';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { PredictionHistoryRepository } from '../repositories/PredictionHistoryRepository';
import { AnalyticsSummaryRepository } from '../repositories/AnalyticsSummaryRepository';
import { AiRecommendationRepository } from '../repositories/AiRecommendationRepository';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export class AiAnalyticsService {
  
  private static async getPayload(userId: string) {
    const [profile, transactions, sessions, habits] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      FinanceRepository.findByUserId(userId),
      StudyRepository.findByUserId(userId),
      HabitRepository.findByUserId(userId),
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

    return {
      transactions: formattedTransactions,
      sessions: formattedSessions,
      habits: formattedHabits,
      monthlyIncome: profile ? Number(profile.monthlyIncome) : 5000.0,
      monthlyExpenseTarget: profile ? Number(profile.monthlyExpenseTarget) : 2500.0,
      dailyStudyHoursTarget: profile ? Number(profile.dailyStudyHoursTarget) : 2.5,
    };
  }

  static async predictFinance(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/predict/finance`, {
      transactions: payload.transactions,
      profile: {
        monthlyIncome: payload.monthlyIncome,
        monthlyExpenseTarget: payload.monthlyExpenseTarget,
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;
    
    // Save to Prediction History
    await PredictionHistoryRepository.addPrediction(userId, {
      predictionType: 'FINANCE',
      predictionResult: data,
      confidenceScore: data.confidence_score / 100.0,
    });

    // Update Analytics Summary
    const summary = await AnalyticsSummaryRepository.findByUserId(userId);
    await AnalyticsSummaryRepository.upsertSummary(userId, {
      financialHealthScore: data.financial_health_score,
      productivityScore: summary ? summary.productivityScore : 0.0,
      habitScore: summary ? summary.habitScore : 0.0,
      overallAIScore: summary ? Number((0.4 * data.financial_health_score + 0.4 * summary.productivityScore + 0.2 * summary.habitScore).toFixed(2)) : data.financial_health_score * 0.4
    });

    return data;
  }

  static async predictStudy(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/predict/study`, {
      sessions: payload.sessions,
      profile: {
        dailyStudyHoursTarget: payload.dailyStudyHoursTarget,
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;

    // Save to Prediction History
    await PredictionHistoryRepository.addPrediction(userId, {
      predictionType: 'STUDY',
      predictionResult: data,
      confidenceScore: data.confidence_score / 100.0,
    });

    // Update Analytics Summary
    const summary = await AnalyticsSummaryRepository.findByUserId(userId);
    await AnalyticsSummaryRepository.upsertSummary(userId, {
      financialHealthScore: summary ? summary.financialHealthScore : 0.0,
      productivityScore: data.productivity_score,
      habitScore: summary ? summary.habitScore : 0.0,
      overallAIScore: summary ? Number((0.4 * summary.financialHealthScore + 0.4 * data.productivity_score + 0.2 * summary.habitScore).toFixed(2)) : data.productivity_score * 0.4
    });

    return data;
  }

  static async predictHabits(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/predict/habits`, {
      habits: payload.habits,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;

    // Save to Prediction History
    await PredictionHistoryRepository.addPrediction(userId, {
      predictionType: 'HABITS',
      predictionResult: data,
      confidenceScore: data.confidence_score / 100.0,
    });

    // Update Analytics Summary
    const summary = await AnalyticsSummaryRepository.findByUserId(userId);
    await AnalyticsSummaryRepository.upsertSummary(userId, {
      financialHealthScore: summary ? summary.financialHealthScore : 0.0,
      productivityScore: summary ? summary.productivityScore : 0.0,
      habitScore: data.overall_performance_score,
      overallAIScore: summary ? Number((0.4 * summary.financialHealthScore + 0.4 * summary.productivityScore + 0.2 * data.overall_performance_score).toFixed(2)) : data.overall_performance_score * 0.2
    });

    return data;
  }

  static async getAnalyticsDashboard(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/analytics/dashboard`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = response.data;

    // Save predictions to history in background
    await Promise.all([
      PredictionHistoryRepository.addPrediction(userId, {
        predictionType: 'FINANCE',
        predictionResult: data.finance,
        confidenceScore: data.finance.confidence_score / 100.0,
      }),
      PredictionHistoryRepository.addPrediction(userId, {
        predictionType: 'STUDY',
        predictionResult: data.study,
        confidenceScore: data.study.confidence_score / 100.0,
      }),
      PredictionHistoryRepository.addPrediction(userId, {
        predictionType: 'HABITS',
        predictionResult: data.habits,
        confidenceScore: data.habits.confidence_score / 100.0,
      }),
      AnalyticsSummaryRepository.upsertSummary(userId, {
        financialHealthScore: data.scores.financialHealthScore,
        productivityScore: data.scores.productivityScore,
        habitScore: data.scores.habitScore,
        overallAIScore: data.scores.overallAIScore,
      })
    ]);

    // Also populate AiRecommendations so they display on standard dashboards
    await AiRecommendationRepository.clearUserRecommendations(userId);
    
    for (const rec of data.finance.recommendations.slice(0, 2)) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'FINANCE',
        recommendationText: rec,
        impactLevel: 'HIGH',
      });
    }

    for (const rec of data.study.recommendations.slice(0, 2)) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'STUDY',
        recommendationText: rec,
        impactLevel: 'HIGH',
      });
    }

    for (const rec of data.habits.recommendations.slice(0, 2)) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'HABITS',
        recommendationText: rec,
        impactLevel: 'MEDIUM',
      });
    }

    // Include prediction history inside dashboard metrics for UI convenience
    const history = await PredictionHistoryRepository.findByUserId(userId);

    return {
      ...data,
      predictionHistory: history.slice(0, 10),
    };
  }

  static async getAnalyticsRecommendations(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/analytics/recommendations`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  static async getAnalyticsTrends(userId: string, token: string) {
    const payload = await this.getPayload(userId);
    const response = await axios.post(`${AI_SERVICE_URL}/analytics/trends`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
}
