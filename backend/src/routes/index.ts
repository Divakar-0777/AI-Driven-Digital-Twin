import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profileController';
import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  importTransactions,
  exportTransactions,
} from '../controllers/financeController';
import {
  createBudget,
  getBudgets,
  deleteBudget,
} from '../controllers/budgetController';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController';
import {
  createSimulation,
  getSimulations,
  deleteSimulation,
} from '../controllers/simulationController';
import {
  runDecisionSimulation,
  createDecisionSimulation,
  getDecisionSimulations,
  getDecisionSimulationById,
  deleteDecisionSimulation,
} from '../controllers/decisionSimulationController';
import { handleChat } from '../controllers/chatController';
import {
  addStudySession,
  getStudySessions,
  updateStudySession,
  deleteStudySession,
  getTotalStudyHours,
} from '../controllers/studyController';
import {
  addHabit,
  getHabits,
  updateHabit,
  deleteHabit,
} from '../controllers/habitController';
import { getActivityHistory } from '../controllers/activityController';
import { getTwinState, syncTwinState } from '../controllers/digitalTwinController';
import { getRecommendations, applyRecommendation } from '../controllers/recommendationController';
import { getNotifications, readNotification, deleteNotification } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';
import {
  predictFinance,
  forecastFinance,
  predictStudy,
  forecastStudy,
  predictHabits,
  forecastHabits,
  getAnalyticsDashboard,
  getAnalyticsRecommendations,
  getAnalyticsTrends,
} from '../controllers/analyticsController';

const router = Router();

// --- Predictive Analytics (Protected) ---
router.post('/predict/finance', authenticateToken as any, predictFinance);
router.get('/forecast/finance', authenticateToken as any, forecastFinance);
router.post('/predict/study', authenticateToken as any, predictStudy);
router.get('/forecast/study', authenticateToken as any, forecastStudy);
router.post('/predict/habits', authenticateToken as any, predictHabits);
router.get('/forecast/habits', authenticateToken as any, forecastHabits);
router.get('/analytics/dashboard', authenticateToken as any, getAnalyticsDashboard);
router.get('/analytics/recommendations', authenticateToken as any, getAnalyticsRecommendations);
router.get('/analytics/trends', authenticateToken as any, getAnalyticsTrends);

// --- Authentication ---
router.post('/register', register);
router.post('/login', login);

// --- Profile (Protected) ---
router.get('/profile', authenticateToken as any, getProfile);
router.put('/profile', authenticateToken as any, updateProfile);
router.delete('/profile', authenticateToken as any, deleteProfile);

// --- Finance (Protected) ---
router.get('/transactions/summary', authenticateToken as any, getMonthlySummary);
router.post('/transactions', authenticateToken as any, addTransaction);
router.get('/transactions', authenticateToken as any, getTransactions);
router.put('/transactions/:id', authenticateToken as any, updateTransaction);
router.delete('/transactions/:id', authenticateToken as any, deleteTransaction);
router.post('/transactions/import', authenticateToken as any, importTransactions);
router.get('/transactions/export', authenticateToken as any, exportTransactions);

// --- Category Budgets (Protected) ---
router.get('/finance/budgets', authenticateToken as any, getBudgets);
router.post('/finance/budgets', authenticateToken as any, createBudget);
router.delete('/finance/budgets/:id', authenticateToken as any, deleteBudget);

// --- Savings Goals (Protected) ---
router.get('/finance/goals', authenticateToken as any, getGoals);
router.post('/finance/goals', authenticateToken as any, createGoal);
router.put('/finance/goals/:id', authenticateToken as any, updateGoal);
router.delete('/finance/goals/:id', authenticateToken as any, deleteGoal);

// --- What If Simulations (Protected) ---
router.get('/finance/simulations', authenticateToken as any, getSimulations);
router.post('/finance/simulate', authenticateToken as any, createSimulation);
router.delete('/finance/simulations/:id', authenticateToken as any, deleteSimulation);

// --- Decision Simulations (Protected) ---
router.post('/decision-simulations/run', authenticateToken as any, runDecisionSimulation);
router.post('/decision-simulations', authenticateToken as any, createDecisionSimulation);
router.get('/decision-simulations', authenticateToken as any, getDecisionSimulations);
router.get('/decision-simulations/:id', authenticateToken as any, getDecisionSimulationById);
router.delete('/decision-simulations/:id', authenticateToken as any, deleteDecisionSimulation);

// --- AI Chat Assistant (Protected) ---
router.post('/chat', authenticateToken as any, handleChat);

// --- Study (Protected) ---
router.get('/study/total-hours', authenticateToken as any, getTotalStudyHours);
router.post('/study', authenticateToken as any, addStudySession);
router.get('/study', authenticateToken as any, getStudySessions);
router.put('/study/:id', authenticateToken as any, updateStudySession);
router.delete('/study/:id', authenticateToken as any, deleteStudySession);

// --- Habits (Protected) ---
router.post('/habits', authenticateToken as any, addHabit);
router.get('/habits', authenticateToken as any, getHabits);
router.put('/habits/:id', authenticateToken as any, updateHabit);
router.delete('/habits/:id', authenticateToken as any, deleteHabit);

// --- Activity (Protected) ---
router.get('/activity', authenticateToken as any, getActivityHistory);

// --- Digital Twin (Protected) ---
router.get('/digital-twin', authenticateToken as any, getTwinState);
router.post('/digital-twin/sync', authenticateToken as any, syncTwinState);

// --- AI Recommendations (Protected) ---
router.get('/recommendations', authenticateToken as any, getRecommendations);
router.put('/recommendations/:id/apply', authenticateToken as any, applyRecommendation);

// --- Notifications (Protected) ---
router.get('/notifications', authenticateToken as any, getNotifications);
router.put('/notifications/:id/read', authenticateToken as any, readNotification);
router.delete('/notifications/:id', authenticateToken as any, deleteNotification);

export default router;
export { router as rootRouter };
