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
  bookingId: number,
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
  files?: any[];
  status: 'pending' | 'ongoing' | 'completed' | 'rejected';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  isDeleted: boolean;
};

export interface BookingModel extends Model<TBooking> {
  isBookingExists(id: string): Promise<TBooking | null>;
}
