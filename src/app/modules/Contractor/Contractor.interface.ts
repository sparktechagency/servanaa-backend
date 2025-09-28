/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TContractor = {
  userId: Types.ObjectId;
  rateHourly: number;
  experience: string;
  bio: string;
  skillsCategory?: string;
  balance?: number;
  dob?: string;
  gender?: string;
  totalEarnings: number;
  pendingBalance: number;
  minimumWithdrawal: number;
  city?: string;
  language?: string;
  location: string;
  ratings: number;
  skills: string | string[];
  subscriptionStatus:
    | 'active'
    | 'inactive'
    | 'cancelled'
    | 'expired'
    | 'failed';

  // Stripe integration
  stripeCustomerId: string;
  customerId: string;
  paymentMethodId: string;
  // stripeAccountId: string;
  certificates: string[];
  materials?: {
    name: string;
    unit?: { type: string };
    price: { type: number };
  }[];
  myScheduleId?: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  hasActiveSubscription: boolean;
  isDeleted: boolean;
};

export interface ContractorModel extends Model<TContractor> {
  isContractorExists(id: string): Promise<TContractor | null>;
}
