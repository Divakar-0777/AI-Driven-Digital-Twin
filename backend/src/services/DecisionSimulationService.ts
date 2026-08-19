import axios from 'axios';
import { DecisionSimulationRepository } from '../repositories/DecisionSimulationRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { StudyRepository } from '../repositories/StudyRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { GoalRepository } from '../repositories/GoalRepository';
import { ActivityRepository } from '../repositories/ActivityRepository';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface RunDecisionSimulationInput {
  decisionName: string;
  category: string;
  action: string;
  parameters: Record<string, any>;
  affectedDomains: string[];
  horizon: string;
  selectedGoals: string[];
  userPriorities: Record<string, number>;
}

export class DecisionSimulationService {
  
  private static async getPayload(userId: string) {
    const [profile, transactions, sessions, habits, goals] = await Promise.all([
      ProfileRepository.findByUserId(userId),
      FinanceRepository.findByUserId(userId),
      StudyRepository.findByUserId(userId),
      HabitRepository.findByUserId(userId),
      GoalRepository.findByUserId(userId),
    ]);

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
      profile: {
        monthlyIncome: profile ? Number(profile.monthlyIncome) : 5000.0,
        monthlyExpenseTarget: profile ? Number(profile.monthlyExpenseTarget) : 2500.0,
        dailyStudyHoursTarget: profile ? Number(profile.dailyStudyHoursTarget) : 2.5,
      },
      transactions: formattedTransactions,
      sessions: formattedSessions,
      habits: formattedHabits,
      goals: formattedGoals,
    };
  }

  static async runSimulation(userId: string, input: RunDecisionSimulationInput, token: string) {
    const statePayload = await this.getPayload(userId);
    
    const response = await axios.post(`${AI_SERVICE_URL}/simulate/decision`, {
      profile: statePayload.profile,
      goals: statePayload.goals,
      transactions: statePayload.transactions,
      sessions: statePayload.sessions,
      habits: statePayload.habits,
      decision: {
        decisionName: input.decisionName,
        category: input.category,
        action: input.action,
        parameters: input.parameters,
        affectedDomains: input.affectedDomains,
      },
      horizon: input.horizon,
      selectedGoals: input.selectedGoals,
      userPriorities: input.userPriorities,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  }

  static async createSimulation(userId: string, input: RunDecisionSimulationInput, token: string) {
    const simulationResult = await this.runSimulation(userId, input, token);
    
    // Save to PostgreSQL via Repository
    const saved = await DecisionSimulationRepository.create(userId, {
      decision: JSON.stringify({
        decisionName: input.decisionName,
        category: input.category,
        action: input.action,
        parameters: input.parameters,
        affectedDomains: input.affectedDomains,
        horizon: input.horizon,
        userPriorities: input.userPriorities,
        model_version: simulationResult.model_version,
      }),
      baseline: JSON.stringify(simulationResult.baseline),
      scenarios: JSON.stringify(simulationResult.scenarios),
      assumptions: JSON.stringify(simulationResult.assumptions),
      outcomes: JSON.stringify(simulationResult.outcomes),
      comparison: JSON.stringify(simulationResult.comparison),
      recommendation: JSON.stringify({
        ...simulationResult.recommendation,
        ranking: simulationResult.ranking
      }),
    });

    await ActivityRepository.logActivity(
      userId,
      'Decision Simulation Saved',
      `Ran and saved decision simulation: "${input.decisionName}"`
    );

    return this.parseSimulationRecord(saved);
  }

  static async getSimulations(userId: string) {
    const list = await DecisionSimulationRepository.findByUserId(userId);
    return list.map(item => this.parseSimulationRecord(item));
  }

  static async getSimulationById(userId: string, id: string) {
    const sim = await DecisionSimulationRepository.findById(id);
    if (!sim) throw new Error('Simulation not found');
    if (sim.userId !== userId) throw new Error('Access denied');
    return this.parseSimulationRecord(sim);
  }

  static async deleteSimulation(userId: string, id: string) {
    const sim = await DecisionSimulationRepository.findById(id);
    if (!sim) throw new Error('Simulation not found');
    if (sim.userId !== userId) throw new Error('Access denied');

    await DecisionSimulationRepository.delete(id);
    await ActivityRepository.logActivity(
      userId,
      'Decision Simulation Deleted',
      `Deleted decision simulation`
    );
  }

  private static parseSimulationRecord(item: any) {
    const recommendationObj = JSON.parse(item.recommendation);
    const decisionObj = JSON.parse(item.decision);
    return {
      id: item.id,
      userId: item.userId,
      decision: decisionObj,
      baseline: JSON.parse(item.baseline),
      scenarios: JSON.parse(item.scenarios),
      assumptions: JSON.parse(item.assumptions),
      outcomes: JSON.parse(item.outcomes),
      comparison: JSON.parse(item.comparison),
      recommendation: recommendationObj,
      ranking: recommendationObj.ranking || [],
      model_version: decisionObj.model_version || 'Comparative-MDP-v1.2',
      createdAt: item.createdAt,
    };
  }
}
