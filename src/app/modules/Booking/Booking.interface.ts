/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Types } from 'mongoose';

// Question interface for booking questions
export interface TBookingQuestion {
  question: string;
  answer: string;
}

// Material interface for booking materials
export interface TBookingMaterial {
  name: string;
  unit: string;
  price: number;
}

export interface DaySchedule {
  days: string;
  timeSlots: string[];
}

export type TBooking = {
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  bookingDate: Date;
  timeSlots: string[];
  price: number;
  bookingType: 'oneTime' | 'weekly';
  periodInDays?: number;

  // Add missing required properties
  questions: TBookingQuestion[];
  material: TBookingMaterial[];
  startTime: string;
  endTime: string;
  day: string | string[];
  duration: number;
  rateHourly: number;

  // Optional properties
  files?: any[];
  clientId?: string;

  // Enhanced status with all required states
  status:
    | 'pending_payment'
    | 'payment_failed'
    | 'confirmed'
    | 'contractor_accepted'
    | 'in_progress'
    | 'work_completed'
    | 'payment_released'
    | 'completed'
    | 'cancelled'
    | 'refunded'
    | 'disputed'
    | 'accepted'
    | 'rejected'
    | 'pending';

  // Enhanced payment status
  paymentStatus:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded'
    | 'transferred_to_contractor'
    | 'disputed';

  // Stripe payment fields
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  stripeTransferId?: string;

  // Payment amounts
  totalAmount: number;
  platformFeeAmount: number;
  contractorEarnings: number;
  refundAmount?: number;

  // Session tracking
  sessionStartedAt?: Date;
  sessionCompletedAt?: Date;
  sessionStartedBy?: Types.ObjectId;
  sessionCompletedBy?: Types.ObjectId;

  // Payment tracking
  paymentReceivedAt?: Date;
  paymentTransferredAt?: Date;

  // Metadata
  paymentMetadata?: {
    customerStripeId?: string;
    contractorStripeAccountId?: string;
    refundReason?: string;
  };

  isDeleted: boolean;
};

export interface BookingModel extends Model<TBooking> {
  isBookingExists(id: string): Promise<TBooking | null>;
}
