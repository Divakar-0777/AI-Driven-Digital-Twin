import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { getProfile, updateProfile, deleteProfile } from '../controllers/profileController';
import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
} from '../controllers/financeController';
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
import { authenticateToken } from '../middleware/auth';

const router = Router();

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

export default router;
export { router as rootRouter };
