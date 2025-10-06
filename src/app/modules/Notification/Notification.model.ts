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
      enum: TypeValues,
      required: true
    },
    message: { type: String, required: true },
    isRead: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Users who have read this notification
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

NotificationSchema.statics.isNotificationExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ bookingId: 1 });

export const Notification = model<TNotification, NotificationModel>(
  'Notification',
  NotificationSchema
);
