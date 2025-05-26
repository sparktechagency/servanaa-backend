/* eslint-disable no-unused-vars */
import { Model, Schema } from 'mongoose';

export type TNotification = {
  clientId: Schema.Types.ObjectId;
  title: 'booking_request' | 'booking_confirm' | 'booking_complete' | 'booking_cancel';
  bookingId: Schema.Types.ObjectId;
  message: string;
  isRead: boolean;
  isDeleted: boolean;
}


export interface NotificationModel extends Model<TNotification> {
  isNotificationExists(id: string): Promise<TNotification | null>;
}
