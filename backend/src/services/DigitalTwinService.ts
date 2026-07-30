import { DigitalTwinRepository } from '../repositories/DigitalTwinRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';

export class DigitalTwinService {
  static async getTwinState(userId: string) {
    let state = await DigitalTwinRepository.findByUserId(userId);
    if (!state) {
      // Initialize with default state if not created yet
      state = await DigitalTwinRepository.upsertTwinState(userId, {
        productivityScore: 50,
        financialHealthScore: 50,
        twinEmoticon: '😐',
        twinStatus: 'Digital Twin initialized. Log some activities to sync!',
      });
    }
    return state;
  }

  static async recalculateTwinState(userId: string) {
    // 1. Fetch Profile targets
    const profile = await ProfileRepository.findByUserId(userId);
    const studyHoursTarget = profile?.dailyStudyHoursTarget || 2.5;
    const expenseTarget = profile ? Number(profile.monthlyExpenseTarget) : 2500;

    // 2. Compute Productivity Score
    const studyStats = await StudyRepository.getAggregateStats(userId);
    const totalMinutes = studyStats._sum.duration || 0;
    const sessionCount = studyStats._count.id || 0;
    const avgRating = studyStats._avg.productivityRating || 3.0; // scale of 1-5

    let studyScore = 50;
    if (sessionCount > 0) {
      // Average productivity rating (scaled to 100)
      const ratingComponent = (avgRating / 5) * 100;
      
      // Target Hours bonus: assume target duration (in minutes) per day
      // Compare total logged minutes to a monthly estimate (e.g. daily target * 10 days of tracking)
      const targetMins = studyHoursTarget * 60;
      const hoursFactor = targetMins > 0 ? Math.min((totalMinutes / (targetMins * 10)) * 100, 100) : 50;
      
      studyScore = (ratingComponent * 0.6) + (hoursFactor * 0.4);
    }

    // Habits Completion rate
    const habits = await HabitRepository.findByUserId(userId);
    let habitsScore = 50;
    if (habits.length > 0) {
      const completedCount = habits.filter(h => h.completed).length;
      habitsScore = (completedCount / habits.length) * 100;
    }

    const productivityScore = Math.round((studyScore * 0.6) + (habitsScore * 0.4));

    // 3. Compute Financial Health Score
    // Fetch this month's transactions
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

    let savingsScore = 50;
    if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      savingsScore = Math.max(0, Math.min(100, savingsRate));
    } else if (totalExpense > 0) {
      savingsScore = 0;
    }

    let budgetScore = 100;
    if (totalExpense > expenseTarget && expenseTarget > 0) {
      const overspendRatio = totalExpense / expenseTarget;
      budgetScore = Math.max(0, 100 - (overspendRatio - 1) * 100);
    }

    const financialHealthScore = Math.round((savingsScore * 0.5) + (budgetScore * 0.5));

    // 4. Select emoticon & status based on both scores
    let twinEmoticon = '😐';
    let twinStatus = 'On track, balanced routine.';

    if (productivityScore >= 75 && financialHealthScore >= 75) {
      twinEmoticon = '🚀';
      twinStatus = 'Digital Twin is Thriving! Highly productive, focused, and maintaining great savings.';
    } else if (productivityScore < 50 && financialHealthScore < 50) {
      twinEmoticon = '😴';
      twinStatus = 'Digital Twin is Sluggish. Studies are slacking and expenses are out of control.';
    } else if (productivityScore >= 70 && financialHealthScore < 50) {
      twinEmoticon = '💸';
      twinStatus = 'Academic Overachiever but Overspending. Work is solid, but look at your expenses!';
    } else if (productivityScore < 50 && financialHealthScore >= 70) {
      twinEmoticon = '📚';
      twinStatus = 'Saving well, but Slacking on learning goals. Time to get back to the textbooks!';
    } else if (productivityScore >= 70) {
      twinEmoticon = '🔥';
      twinStatus = 'Focused and highly productive on learning tasks!';
    }

    return DigitalTwinRepository.upsertTwinState(userId, {
      productivityScore,
      financialHealthScore,
      twinEmoticon,
      twinStatus,
    });
  }
}
