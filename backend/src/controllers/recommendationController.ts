import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AiRecommendationService } from '../services/AiRecommendationService';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const recommendations = await AiRecommendationService.getRecommendations(userId);
    return res.status(200).json(recommendations);
  } catch (error: any) {
    console.error('Get Recommendations Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const applyRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await AiRecommendationService.applyRecommendation(id);
    return res.status(200).json({ message: 'Recommendation marked as applied', recommendation: updated });
  } catch (error: any) {
    console.error('Apply Recommendation Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
