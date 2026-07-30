import { NotificationRepository, NotificationInput } from '../repositories/NotificationRepository';

export class NotificationService {
  static async getNotifications(userId: string) {
    return NotificationRepository.findByUserId(userId);
  }

  static async markAsRead(userId: string, id: string) {
    const notification = await NotificationRepository.findById(id);
    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== userId) throw new Error('Access denied');

    return NotificationRepository.markAsRead(id);
  }

  static async deleteNotification(userId: string, id: string) {
    const notification = await NotificationRepository.findById(id);
    if (!notification) throw new Error('Notification not found');
    if (notification.userId !== userId) throw new Error('Access denied');

    return NotificationRepository.deleteNotification(id);
  }
}
