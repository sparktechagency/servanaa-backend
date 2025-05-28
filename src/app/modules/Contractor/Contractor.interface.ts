/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TContractor = {
   userId: Types.ObjectId;
   rateHourly: number;
   skillsCategory?: string;  
   dob?: string;
   gender?: string;
   city?: string;
   language?: string;
   location: string;
   
   ratings: number;
   skills: string | string[];  
   subscriptionStatus:  "pending" | "active" | "failed" | "cancelled"  | "paused";
   customerId: string;
   paymentMethodId: string;
   certificates: string[];
   materials: string[]; 
   mySchedule?: {
   day: string; // The day of the week (e.g., "Monday")
   startTime: { type: string},
   endTime: { type: string},
    }[];
    isDeleted: boolean;
};

export interface ContractorModel extends Model<TContractor> {
  isContractorExists(id: string): Promise<TContractor | null>;
}
