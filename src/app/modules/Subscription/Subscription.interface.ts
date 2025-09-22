import { Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  contractorId: Types.ObjectId;
  planType: 'gold' | 'platinum' | 'diamond';
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
  type: 'gold' | 'platinum' | 'diamond';
  duration: number;
  price: number;
  stripePriceId: string;
  features: string[];
  isActive: boolean;
}





