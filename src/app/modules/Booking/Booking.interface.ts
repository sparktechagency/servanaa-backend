/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TBooking = {
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  materialId: Types.ObjectId;
  bookingType: {
    type: "Just Once" | "Weekly";
    days: string | string[]; // string YYYY-MM-DD or array of weekdays
  };
  duration: number;
  price: number;
  paymentIntent?: string;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'failed';
  date: string;
  startTime: string;
  endTime: string;
  isDeleted: boolean;
};

export interface BookingModel extends Model<TBooking> {
  isBookingExists(id: string): Promise<TBooking | null>;
}
