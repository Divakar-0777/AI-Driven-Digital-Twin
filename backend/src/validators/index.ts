import { z } from 'zod';

// Password strength pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const RegisterSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email address format'),
  password: z.string().regex(
    passwordRegex,
    'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime({ precision: null, offset: true }).or(z.string().date()).optional().nullable(),
  occupation: z.string().optional(),
  educationLevel: z.string().optional(),
  monthlyIncome: z.number().nonnegative('Monthly income must be a positive number').optional().default(0),
  monthlyExpenseTarget: z.number().nonnegative('Monthly expense target must be a positive number').optional().default(0),
  studyGoal: z.string().optional(),
  dailyStudyHoursTarget: z.number().nonnegative('Daily study hours target must be a positive number').optional().default(0),
  habitGoals: z.string().optional(),
  profilePhotoUrl: z.string().url('Invalid URL format for profile photo').or(z.string().length(0)).optional().nullable(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required').optional(),
  email: z.string().email('Invalid email address format').optional(),
  password: z.string().regex(passwordRegex, 'Password is too weak').optional(),
  phoneNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().datetime({ precision: null, offset: true }).or(z.string().date()).optional().nullable(),
  occupation: z.string().optional().nullable(),
  educationLevel: z.string().optional().nullable(),
  monthlyIncome: z.number().nonnegative('Monthly income must be a positive number').optional(),
  monthlyExpenseTarget: z.number().nonnegative('Monthly expense target must be a positive number').optional(),
  studyGoal: z.string().optional().nullable(),
  dailyStudyHoursTarget: z.number().nonnegative('Daily study hours target must be a positive number').optional(),
  habitGoals: z.string().optional().nullable(),
  profilePhotoUrl: z.string().url('Invalid URL format for profile photo').or(z.string().length(0)).optional().nullable(),
});

export const FinancialTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['INCOME', 'EXPENSE'], { errorMap: () => ({ message: "Type must be 'INCOME' or 'EXPENSE'" }) }),
  amount: z.number().nonnegative('Amount must be a positive number'),
  date: z.string().datetime().or(z.string().date()).optional().default(() => new Date().toISOString()),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  notes: z.string().optional().nullable(),
});

export const StudySessionSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  duration: z.number().positive('Duration must be greater than 0 minutes'),
  date: z.string().datetime().or(z.string().date()).optional().default(() => new Date().toISOString()),
  productivityRating: z.number().int().min(1).max(5, 'Productivity rating must be between 1 and 5'),
  notes: z.string().optional().nullable(),
});

export const HabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  targetFrequency: z.string().min(1, 'Target frequency is required'),
  completed: z.boolean().optional().default(false),
  date: z.string().datetime().or(z.string().date()).optional().default(() => new Date().toISOString().split('T')[0]),
});

export const BudgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Monthly limit must be greater than 0'),
  period: z.string().optional().default('MONTHLY'),
  status: z.string().optional().default('ACTIVE'),
});

export const GoalSchema = z.object({
  goalName: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than 0'),
  currentAmount: z.number().nonnegative('Current amount must be a positive number').optional().default(0),
  monthlyContribution: z.number().nonnegative('Monthly contribution must be a positive number').optional().default(0),
  targetDate: z.string().datetime().or(z.string().date()),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  goalCategory: z.string().min(1, 'Goal category is required'),
  status: z.string().optional().default('ACTIVE'),
});

export const SimulationSchema = z.object({
  scenarioName: z.string().min(1, 'Scenario name is required'),
  assumptions: z.string().min(1, 'Assumptions are required'),
  projectedIncome: z.number().nonnegative(),
  projectedExpenses: z.number().nonnegative(),
  projectedSavings: z.number(),
  projectedBalance: z.number(),
  goalImpact: z.string().optional().nullable(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH']).optional().default('LOW'),
});

export const DecisionSimulationInputSchema = z.object({
  decisionName: z.string().min(1, 'Decision name is required'),
  category: z.string().min(1, 'Category is required'),
  action: z.string().min(1, 'Action is required'),
  parameters: z.record(z.any()).default({}),
  affectedDomains: z.array(z.string()).min(1, 'At least one affected domain is required'),
  horizon: z.string().min(1, 'Simulation horizon is required'),
  selectedGoals: z.array(z.string()).optional().default([]),
  userPriorities: z.record(z.number()).default({}),
});
