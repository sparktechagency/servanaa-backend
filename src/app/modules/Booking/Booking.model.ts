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
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: [true, 'Sub category ID is required']
    },

    // Fix enum values to match your service
    bookingType: {
      type: String,
      enum: {
        values: ['oneTime', 'weekly'], // Changed from 'OneTime', 'Weekly'
        message: '{VALUE} is not a valid booking type'
      },
      required: [true, 'Booking type is required']
    },

    // Add missing required fields
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
        price: {
          type: Number,
          required: [true, 'Material price is required'],
          min: [0, 'Material price cannot be negative']
        }
      }
    ],

    // Time and date fields
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

    // Pricing fields - Update to match interface
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

    // Add totalAmount as required field
    totalAmount: {
      type: Number,
      required: [false, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    platformFeeAmount: {
      type: Number,
      required: [false, 'Platform fee amount is required'],
      min: [0, 'Platform fee cannot be negative']
    },
    contractorEarnings: {
      type: Number,
      required: [false, 'Contractor earnings is required'],
      min: [0, 'Contractor earnings cannot be negative']
    },

    // Optional pricing fields
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },

    // Booking status
    status: {
      type: String,
      enum: {
        values: [
          'pending_payment',
          'payment_failed',
          'confirmed',
          'contractor_accepted',
          'in_progress',
          'work_completed',
          'payment_released',
          'completed',
          'cancelled',
          'refunded',
          'disputed',
          'accepted',
          'rejected',
          'pending'
        ],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'pending',
          'paid',
          'failed',
          'refunded',
          'transferred_to_contractor',
          'disputed'
        ],
        message: '{VALUE} is not a valid payment status'
      },
      default: 'pending'
    },

    // Stripe payment fields
    stripePaymentIntentId: String,
    stripeChargeId: String,
    stripeRefundId: String,
    stripeTransferId: String,

    // Session tracking
    sessionStartedAt: Date,
    sessionCompletedAt: Date,
    sessionStartedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sessionCompletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    // Payment tracking
    paymentReceivedAt: Date,
    paymentTransferredAt: Date,

    // Metadata
    paymentMetadata: {
      customerStripeId: String,
      contractorStripeAccountId: String,
      refundReason: String
    },

    // Weekly booking specific
    periodInDays: {
      type: Number,
      min: [1, 'Period must be at least 1 day']
    },

    // Files
    files: [Schema.Types.Mixed],
    clientId: String,

    // Soft delete
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
