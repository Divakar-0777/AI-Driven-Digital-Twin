import { GoalRepository, GoalInput } from '../repositories/GoalRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';
import prisma from '../database/prismaClient';

export interface GenericGoalInput {
  goalName: string;
  description?: string | null;
  goalType: string;
  targetValue: number;
  currentValue?: number;
  unit?: string | null;
  deadline?: Date | null;
  priority?: string;
  status?: string;
}

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

  // Generic Goal methods (for Goal model)
  static async createGenericGoal(userId: string, data: GenericGoalInput) {
    const progressPercent = data.targetValue > 0
      ? Math.round(((data.currentValue || 0) / data.targetValue) * 100)
      : 0;
    const goal = await prisma.goal.create({
      data: {
        userId,
        goalName: data.goalName,
        description: data.description || null,
        goalType: data.goalType,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit || null,
        deadline: data.deadline || null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'ACTIVE',
        progressPercent,
      },
    });
    await ActivityRepository.logActivity(userId, 'Goal Created', `Created goal "${data.goalName}" (${data.goalType})`);
    return goal;
  }

  static async getGenericGoals(userId: string) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateGenericGoal(userId: string, id: string, data: Partial<GenericGoalInput>) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new Error('Goal not found');

    const updateData: any = { ...data };
    if (data.deadline) updateData.deadline = new Date(data.deadline);
    if (data.targetValue !== undefined && data.currentValue !== undefined) {
      updateData.progressPercent = data.targetValue > 0
        ? Math.round((data.currentValue / data.targetValue) * 100)
        : 0;
    }

    const updated = await prisma.goal.update({ where: { id }, data: updateData });
    await ActivityRepository.logActivity(userId, 'Goal Updated', `Updated goal "${updated.goalName}"`);
    return updated;
  }

  static async deleteGenericGoal(userId: string, id: string) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new Error('Goal not found');

    await prisma.goal.delete({ where: { id } });
    await ActivityRepository.logActivity(userId, 'Goal Deleted', `Deleted goal "${goal.goalName}"`);
  }
}
