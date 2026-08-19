import { GoalRepository, GoalInput } from '../repositories/GoalRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

export class GoalService {
  static async createGoal(userId: string, data: GoalInput) {
    const goal = await GoalRepository.createGoal(userId, data);
    await ActivityRepository.logActivity(userId, 'Goal Created', `Created savings goal "${data.goalName}" with a target of $${data.targetAmount}`);
    return goal;
  }

  static async getGoals(userId: string) {
    const goals = await GoalRepository.findByUserId(userId);
    return goals.map((goal) => {
      const target = Number(goal.targetAmount);
      const current = Number(goal.currentAmount);
      const progress = target > 0 ? Math.round((current / target) * 100) : 0;
      const remaining = Math.max(0, target - current);
      return {
        ...goal,
        progress,
        remaining,
      };
    });
  }

  static async updateGoal(userId: string, id: string, data: Partial<GoalInput>) {
    const goal = await GoalRepository.findById(id);
    if (!goal) throw new Error('Goal not found');
    if (goal.userId !== userId) throw new Error('Access denied');

    const updated = await GoalRepository.updateGoal(id, data);
    await ActivityRepository.logActivity(userId, 'Goal Updated', `Updated savings goal "${updated.goalName}"`);
    return updated;
  }

  static async deleteGoal(userId: string, id: string) {
    const goal = await GoalRepository.findById(id);
    if (!goal) throw new Error('Goal not found');
    if (goal.userId !== userId) throw new Error('Access denied');

    await GoalRepository.deleteGoal(id);
    await ActivityRepository.logActivity(userId, 'Goal Deleted', `Deleted savings goal "${goal.goalName}"`);
  }
}
