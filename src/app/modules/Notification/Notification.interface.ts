/* eslint-disable no-unused-vars */
import { Model, Schema } from 'mongoose';

export type TNotification = {
  userId: Schema.Types.ObjectId;
  title: string;
  message: string; 
  isRead: boolean;
  isDeleted: boolean;
}


export interface NotificationModel extends Model<TNotification> {
  isNotificationExists(id: string): Promise<TNotification | null>;
}
