/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TBooking = {
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  // categoryId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  rateHourly: number;
  questions: { question: string; answer: string }[]; // Array of question-answer objects
  material: { name: string; unit: string; price: number }[]; // Array of material objects with name, unit, and price
  bookingType: "Just Once" | "Weekly";
  duration: number;
  price: number;
  paymentIntent?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'failed';
  days: string; // string YYYY-MM-DD/Day like sunday for each week
  timeSlots?: string[]; // string YYYY-MM-DD/Day like sunday for each week
  startTime: string;
  endTime: string;
  isDeleted: boolean;
};

export interface BookingModel extends Model<TBooking> {
  isBookingExists(id: string): Promise<TBooking | null>;
}
