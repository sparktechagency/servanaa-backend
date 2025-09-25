/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TNotification = {
  userId: Types.ObjectId;
  title: string;
  type: keyof typeof import('./Notification.constant').NOTIFICATION_TYPES;
  message: string;
  isRead: Types.ObjectId[]; // Array of user IDs who have read this notification
  bookingId?: Types.ObjectId; // Reference to related booking
  amount?: number; // For payment-related notifications
  metadata?: {
    paymentIntentId?: string;
    stripeChargeId?: string;
    refundAmount?: number;
    payoutId?: string;
    contractorId?: string;
    withdrawalId?: string;
    disputeId?: string; // Add dispute ID
    disputeReason?: string; // Add dispute reason
    chargeId?: string; // Add charge ID for disputes
  };
  isDeleted: boolean;
};

export interface NotificationModel extends Model<TNotification> {
  isNotificationExists(id: string): Promise<TNotification | null>;
}
