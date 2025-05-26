/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from 'mongoose';
import { TBooking, BookingModel } from './Booking.interface';

const BookingSchema = new Schema<TBooking, BookingModel>({
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  frequency: {
    type: {
      type: String,
      enum: ["Just Once", "Weekly"],
      required: true,
    },
    days: {
      type: Schema.Types.Mixed, // string or array of strings
      required: true,
      validate: {
        validator: function (v: any) {
          if (this.frequency.type === "Just Once") {
            return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v); // YYYY-MM-DD
          }
          if (this.frequency.type === "Weekly") {
            return Array.isArray(v) && v.every(day => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day));
          }
          return false;
        },
        message: "Invalid frequency.days format",
      },
    },
  },
  duration: {
    type: Number,
    required: true,
    min: [1, "Duration must be at least 1 hour"],
  },
  paymentIntent: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ["pending", "ongoing", "completed", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid","cancelled", "failed"],
    default: "pending",
  },
  date: { type: String, default: new Date().toISOString().split('T')[0] },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^\d{2}:\d{2}$/.test(v),
      message: "Invalid startTime format (HH:mm)",
    },
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => /^\d{2}:\d{2}$/.test(v),
      message: "Invalid endTime format (HH:mm)",
    },
  },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
});

BookingSchema.statics.isBookingExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Booking = model<TBooking, BookingModel>('Booking', BookingSchema);
