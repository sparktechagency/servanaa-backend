/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';
           
export type TBooking = {
  customerId:Types.ObjectId;
  contractorId:Types.ObjectId;
  categoryId: Types.ObjectId; // Duration in hours
  subCategoryId:   Types.ObjectId; // Duration in hours
  materialId:   Types.ObjectId; // Duration in hours
  bookingType: {
    toObject: any;
    type: "Just Once" | "Weekly"; // Defines whether it's one-time or recurring
    days: string | string[]; // Date string for Just Once, array of days for Weekly
  };
  duration: number; // Duration in hours
  price: number; // Duration in hours
  paymentIntent?: string; // Duration in hours
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
