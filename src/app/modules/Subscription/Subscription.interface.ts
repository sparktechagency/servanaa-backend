import { Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  contractorId: Types.ObjectId;
  planType: 'basic' | 'premium';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'failed';
  startDate: Date;
  endDate: Date;
  paymentMethodId?: string;
  isDeleted: boolean;
}

export interface ISubscriptionPlan extends Document {
  name: string;
  type: 'basic' | 'premium';
  duration: number;
  price: number;
  stripePriceId: string;
  features: string[];
  isActive: boolean;
}
