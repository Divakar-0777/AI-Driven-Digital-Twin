import { AiRecommendationRepository } from '../repositories/AiRecommendationRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';

export class AiRecommendationService {
  static async getRecommendations(userId: string) {
    const list = await AiRecommendationRepository.findByUserId(userId);
    if (list.length === 0) {
      // Auto-generate initial recommendations if none exist
      await this.generateRecommendations(userId);
      return AiRecommendationRepository.findByUserId(userId);
    }
    return list;
  }

  static async generateRecommendations(userId: string) {
    // 1. Clear old recommendations
    await AiRecommendationRepository.clearUserRecommendations(userId);

    // 2. Load User Profile data
    const profile = await ProfileRepository.findByUserId(userId);
    const studyHoursTarget = profile?.dailyStudyHoursTarget || 2.5;
    const expenseTarget = profile ? Number(profile.monthlyExpenseTarget) : 2500;

    // --- Study Analysis & Recommendations ---
    const studyStats = await StudyRepository.getAggregateStats(userId);
    const totalMinutes = studyStats._sum.duration || 0;
    const sessionCount = studyStats._count.id || 0;
    const avgRating = studyStats._avg.productivityRating || 3.0;

    if (sessionCount === 0) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'STUDY',
        recommendationText: 'Begin tracking your study sessions. Log at least one session today to initialize learning data.',
        impactLevel: 'HIGH',
      });
    } else {
      const avgHoursDaily = totalMinutes / (10 * 60); // assume 10 tracking periods
      if (avgHoursDaily < studyHoursTarget) {
        await AiRecommendationRepository.createRecommendation(userId, {
          category: 'STUDY',
          recommendationText: `You are averaging lower than your daily study target (${studyHoursTarget} hrs). Try scheduling short, focused 45-minute blocks.`,
          impactLevel: 'HIGH',
        });
      }
      if (avgRating < 3.5) {
        await AiRecommendationRepository.createRecommendation(userId, {
          category: 'STUDY',
          recommendationText: 'Your average productivity rating is below 3.5/5. Try eliminating tabs, using focus timers, or changing environments.',
          impactLevel: 'MEDIUM',
        });
      }
    }

    // --- Habits Analysis & Recommendations ---
    const habits = await HabitRepository.findByUserId(userId);
    if (habits.length === 0) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'HABITS',
        recommendationText: 'Define small daily habits (e.g., drink 3L water, read 15 mins) to build active checklists and discipline.',
        impactLevel: 'LOW',
      });
    } else {
      const completedCount = habits.filter(h => h.completed).length;
      const rate = (completedCount / habits.length) * 100;
      if (rate < 70) {
        await AiRecommendationRepository.createRecommendation(userId, {
          category: 'HABITS',
          recommendationText: `Your habit completion rate is at ${Math.round(rate)}%. Set morning and evening checklist reminders to stay consistent.`,
          impactLevel: 'MEDIUM',
        });
      } else {
        await AiRecommendationRepository.createRecommendation(userId, {
          category: 'HABITS',
          recommendationText: 'Excellent habit completion consistency! Challenge yourself by adding one new target routine.',
          impactLevel: 'LOW',
        });
      }
    }

    // --- Finance Analysis & Recommendations ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);
    const txs = await FinanceRepository.findInDateRange(userId, startOfMonth, endOfMonth);

    let totalIncome = 0;
    let totalExpense = 0;
    txs.forEach(t => {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') totalIncome += amt;
      else totalExpense += amt;
    });

    if (txs.length === 0) {
      await AiRecommendationRepository.createRecommendation(userId, {
        category: 'FINANCE',
        recommendationText: 'Log your core transactions (income/expense) to enable budget targets auditing.',
        impactLevel: 'HIGH',
      });
    } else {
      if (totalExpense > expenseTarget && expenseTarget > 0) {
        await AiRecommendationRepository.createRecommendation(userId, {
          category: 'FINANCE',
          recommendationText: `Warning: You have exceeded your target budget limit by $${(totalExpense - expenseTarget).toFixed(2)}. Cut non-essential spends.`,
          impactLevel: 'HIGH',
        });
      }
      if (totalIncome > 0) {
        const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
        if (savingsRate > 20) {
          await AiRecommendationRepository.createRecommendation(userId, {
            category: 'FINANCE',
            recommendationText: `Great job saving ${Math.round(savingsRate)}% of your income! Allocate surplus funds to high-yield savings to beat inflation.`,
            impactLevel: 'MEDIUM',
          });
        } else if (savingsRate < 10) {
          await AiRecommendationRepository.createRecommendation(userId, {
            category: 'FINANCE',
            recommendationText: 'Your monthly savings rate is below 10%. Automate savings transfer at the beginning of the month.',
            impactLevel: 'HIGH',
          });
        }
      }
    }
  }

  static async applyRecommendation(id: string) {
    return AiRecommendationRepository.markAsApplied(id, true);
  }
}
