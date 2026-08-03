import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiAnalyticsService } from '../services/AiAnalyticsService';
import { PredictionHistoryRepository } from '../repositories/PredictionHistoryRepository';

const getAuthToken = (req: AuthRequest): string => {
  const authHeader = req.headers['authorization'];
  return (authHeader && authHeader.split(' ')[1]) || '';
};

export const predictFinance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictFinance(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Predict Finance Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to generate financial prediction' });
  }
};

export const forecastFinance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const latest = await PredictionHistoryRepository.findLatestByUserId(userId, 'FINANCE');
    if (latest) {
      return res.status(200).json(latest.predictionResult);
    }
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictFinance(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Forecast Finance Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve financial forecast' });
  }
};

export const predictStudy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictStudy(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Predict Study Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to generate study prediction' });
  }
};

export const forecastStudy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const latest = await PredictionHistoryRepository.findLatestByUserId(userId, 'STUDY');
    if (latest) {
      return res.status(200).json(latest.predictionResult);
    }
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictStudy(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Forecast Study Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve study forecast' });
  }
};

export const predictHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictHabits(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Predict Habits Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to generate habit prediction' });
  }
};

export const forecastHabits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const latest = await PredictionHistoryRepository.findLatestByUserId(userId, 'HABITS');
    if (latest) {
      return res.status(200).json(latest.predictionResult);
    }
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.predictHabits(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Forecast Habits Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve habit forecast' });
  }
};

export const getAnalyticsDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.getAnalyticsDashboard(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Get Analytics Dashboard Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to fetch analytics dashboard metrics' });
  }
};

export const getAnalyticsRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.getAnalyticsRecommendations(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Get Recommendations Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to fetch recommendations' });
  }
};

export const getAnalyticsTrends = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const token = getAuthToken(req);
    const result = await AiAnalyticsService.getAnalyticsTrends(userId, token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Get Trends Error:', error?.response?.data || error.message);
    return res.status(500).json({ error: error?.response?.data?.detail || 'Failed to fetch trend reports' });
  }
};
