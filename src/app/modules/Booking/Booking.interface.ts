/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

// Define DaySchedule type
export type DaySchedule = {
  days: string;
  timeSlots: string[];
}

export type TBooking = {
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  rateHourly: number;
  bookingDate: Date;
  files: string[]; // Array of file URLs or IDs
  periodInDays: number;
  questions: { question: string; answer: string }[]; // Array of question-answer objects
  material: { name: string; unit: string; price: number }[]; // Array of material objects with name, unit, and price
  bookingType: "OneTime" | "Weekly";
  duration: number;
  price: number;
  paymentIntent?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'failed';
  day: string; // string YYYY-MM-DD/Day like sunday for each week
  timeSlots?: string[]; // string YYYY-MM-DD/Day like sunday for each week
  startTime: string;
  endTime: string;
  isDeleted: boolean;
};

export interface BookingModel extends Model<TBooking> {
  isBookingExists(id: string): Promise<TBooking | null>;
}
