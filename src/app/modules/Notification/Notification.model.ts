import { Schema, model } from 'mongoose';
import { TNotification, NotificationModel } from './Notification.interface';
import { TypeValues } from './Notification.constant';

const NotificationSchema = new Schema<TNotification, NotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(TypeValues)
      // enum: ['active', 'blocked'],
      // default: 'active',
    },
    message: { type: String, required: true },
    isRead: { type: [String], default: [] }
  },
  { timestamps: true }
);

NotificationSchema.statics.isNotificationExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Notification = model<TNotification, NotificationModel>(
  'Notification',
  NotificationSchema
);
