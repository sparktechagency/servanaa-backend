/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TContractor = {
  userId: Types.ObjectId;
  rateHourly: number;
  experience: string;
  bio: string;
  skillsCategory?: string;
  dob?: string;
  gender?: string;
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
  stripeAccountId: string;

  // Balance management for your payment system
  balance: number; // Available balance for withdrawal
  totalEarnings: number; // Total lifetime earnings
  pendingBalance: number; // Funds from completed jobs waiting for transfer
  minimumWithdrawal: number; // Minimum amount for withdrawal

  // Bank account for withdrawals
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    bankName?: string;
    verified: boolean;
    verifiedAt?: Date;
  };

  // Withdrawal history with proper _id typing
  withdrawalHistory: {
    _id?: Types.ObjectId; // Add _id property
    amount: number;
    requestedAt: Date;
    processedAt?: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    stripePayoutId?: string;
    failureReason?: string;
  }[];

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
