import { Schema, model } from 'mongoose';
import { TBooking, BookingModel } from './Booking.interface';

const bookingSchema = new Schema<TBooking>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contractor ID is required']
    },
    location: {
      type: String,
      default: null,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: [true, 'Sub category ID is required']
    },
    bookingId: {
      type: Number,
      required: true,
    },
    bookingType: {
      type: String,
      enum: {
        values: ['oneTime', 'weekly'],
        message: '{VALUE} is not a valid booking type'
      },
      required: [true, 'Booking type is required']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'ongoing', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    questions: [
      {
        question: {
          type: String,
          required: [true, 'Question is required']
        },
        answer: {
          type: String,
          required: [true, 'Answer is required']
        }
      }
    ],
    material: [
      {
        name: {
          type: String,
          required: [true, 'Material name is required']
        },
        unit: {
          type: String,
          required: [true, 'Material unit is required']
        },
        count: {
          type: Number,
          required: [true, 'Material count is required']
        },
        price: {
          type: Number,
          required: [true, 'Material price is required'],
          min: [0, 'Material price cannot be negative']
        }
      }
    ],
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required']
    },
    day: {
      type: Schema.Types.Mixed, // Can be string or array
      required: [true, 'Day is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid start time format']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid end time format']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 hour']
    },
    timeSlots: [
      {
        type: String,
        required: true
      }
    ],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    rateHourly: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    files: [Schema.Types.Mixed],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
bookingSchema.index({ contractorId: 1, bookingDate: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ bookingType: 1, status: 1 });

// Static method to check if booking exists
bookingSchema.statics.isBookingExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: { $ne: true } });
};

// Create and export the model
export const Booking = model<TBooking, BookingModel>('Booking', bookingSchema);
