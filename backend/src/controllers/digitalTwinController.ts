import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DigitalTwinService } from '../services/DigitalTwinService';

export const getTwinState = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const state = await DigitalTwinService.getTwinState(userId);
    return res.status(200).json(state);
  } catch (error: any) {
    console.error('Get Twin State Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const syncTwinState = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const state = await DigitalTwinService.recalculateTwinState(userId);
    return res.status(200).json({ message: 'Digital Twin synced successfully', state });
  } catch (error: any) {
    console.error('Sync Twin State Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
