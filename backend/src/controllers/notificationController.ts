import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const list = await NotificationService.getNotifications(userId);
    return res.status(200).json(list);
  } catch (error: any) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const updated = await NotificationService.markAsRead(userId, id);
    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Read Notification Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    await NotificationService.deleteNotification(userId, id);
    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete Notification Error:', error);
    return res.status(400).json({ error: error.message || 'Internal Server Error' });
  }
};
