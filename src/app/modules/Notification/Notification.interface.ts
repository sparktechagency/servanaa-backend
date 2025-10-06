/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TNotification = {
  userId?: Types.ObjectId;
  title: string;
  type: keyof typeof import('./Notification.constant').NOTIFICATION_TYPES;
  message: string;
  isRead: Types.ObjectId[]; // Array of user IDs who have read this notification
  bookingId?: Types.ObjectId; // Reference to related booking
  amount?: number; // For payment-related notifications
  isDeleted: boolean;
};

export interface NotificationModel extends Model<TNotification> {
  isNotificationExists(id: string): Promise<TNotification | null>;
}
