/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema, model } from 'mongoose';
import { TBooking, BookingModel } from './Booking.interface';

const BookingSchema = new Schema<TBooking, BookingModel>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // categoryId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Category',
    //   required: true,
    // },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true,
    },
    rateHourly: {
      type: Number,
      required: true,
      min: [0, 'Price must be non-negative'],
    },

    // questions: Array of question-answer objects
    questions: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],

    // material: Array of material objects with name, unit, and price
    material: [
      {
        name: { type: String, required: true },
        unit: { type: String },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price must be non-negative'],
        },
      },
    ],
    timeSlots: [String],

    bookingType: {
      type: String,
      enum: ['OneTime', 'Weekly'],
      required: true,
    },
    duration: { type: Number, required: true }, // duration as string
    periodInDays: { type: Number}, // duration as string
   bookingDate: { type: Date, default: Date.now },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be non-negative'],
    },
    paymentIntent: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'ongoing', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'failed'],
      default: 'pending',
    },

    // `days` can be either a string (YYYY-MM-DD) or an array of weekdays
    day: {
      type: String,
      required: true,
    },
    // days: {
    //   type: Schema.Types.Mixed,
    //   required: true,
    //   validate: {
    //     validator: function (v: any) {
    //       if (this.bookingType === 'OneTime') {
    //         // For 'OneTime', expect a single date string in 'YYYY-MM-DD' format
    //         return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); // Date format validation
    //       }
    //       if (this.bookingType === 'Weekly') {
    //         // For 'Weekly', expect a single weekday name (e.g., 'Monday')
    //         const validDays = [
    //           'Monday',
    //           'Tuesday',
    //           'Wednesday',
    //           'Thursday',
    //           'Friday',
    //           'Saturday',
    //           'Sunday',
    //         ];
    //         return typeof v === 'string' && validDays.includes(v); // Day name validation
    //       }
    //       return false;
    //     },
    //     message: 'Invalid bookingType.days format',
    //   },
    // },

    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{2}:\d{2}$/.test(v), // Validate time slot format (HH:mm)
        message: 'Invalid timeSlot format (HH:mm)',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^\d{2}:\d{2}$/.test(v), // Validate time slot format (HH:mm)
        message: 'Invalid timeSlot format (HH:mm)',
      },
    },

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// Static method to check if booking exists and not deleted
BookingSchema.statics.isBookingExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Booking = model<TBooking, BookingModel>('Booking', BookingSchema);
