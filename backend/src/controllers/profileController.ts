import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProfileUpdateSchema } from '../validators';
import { ProfileService } from '../services/ProfileService';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const profile = await ProfileService.getProfile(userId);
    return res.status(200).json(profile);
  } catch (error: any) {
    console.error('Get Profile Error:', error);
    return res.status(404).json({ error: error.message || 'Internal Server Error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const parseResult = ProfileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
    }

    const updated = await ProfileService.updateProfile(userId, parseResult.data);
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        ...updated,
        id: userId,
        monthlyIncome: Number(updated.monthlyIncome),
        monthlyExpenseTarget: Number(updated.monthlyExpenseTarget),
        dailyStudyHoursTarget: Number(updated.dailyStudyHoursTarget),
      },
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    await ProfileService.deleteProfile(userId);
    return res.status(200).json({ message: 'User account and all related records deleted successfully' });
  } catch (error: any) {
    console.error('Delete Profile Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
