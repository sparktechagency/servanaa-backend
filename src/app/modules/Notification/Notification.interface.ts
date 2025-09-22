/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TNotification = {
  userId: Types.ObjectId;
  // userId: Schema.Types.ObjectId;
  title: string;
  type: 'bookingCreate | bookingUpdate ';
  message: string; 
  isRead: string[];
}


export interface NotificationModel extends Model<TNotification> {
  isNotificationExists(id: string): Promise<TNotification | null>;
}
