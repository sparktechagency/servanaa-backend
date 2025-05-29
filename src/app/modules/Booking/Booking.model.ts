/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from 'mongoose';
import { TBooking, BookingModel } from './Booking.interface';

const BookingSchema = new Schema<TBooking, BookingModel>({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  contractorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory", required: true },
  materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },

  bookingType: {
    type: {
      type: String,
      enum: ["Just Once", "Weekly"],
      required: true,
    },
    days: {
      type: Schema.Types.Mixed, // string or string[]
      required: true,
      validate: {
        validator: function (v: any) {
          if (this.bookingType.type === "Just Once") {
            return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v); // YYYY-MM-DD format
          }
          if (this.bookingType.type === "Weekly") {
            return Array.isArray(v) && v.every(day => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].includes(day));
          }
          return false;
        },
        message: "Invalid bookingType.days format",
      },
    },
  },

  duration: {
    type: Number,
    required: true,
    min: [1, "Duration must be at least 1 hour"],
  },

  price: {
    type: Number,
    required: true,
    default: 0,
  },

  paymentIntent: {
    type: String,
    default: '',
  },

  status: {
    type: String,
    enum: ["pending", "ongoing", "completed", "cancelled"],
    default: "pending",
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "cancelled", "failed"],
    default: "pending",
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
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

  isDeleted: {
    type: Boolean,
    default: false,
  },

}, {
  timestamps: true,
});

// Static method to check if booking exists and not deleted
BookingSchema.statics.isBookingExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Booking = model<TBooking, BookingModel>('Booking', BookingSchema);
