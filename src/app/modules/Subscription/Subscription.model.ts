import { Schema, model } from 'mongoose';

export interface TSubscription {
  contractorId: Schema.Types.ObjectId;
  planType: 'gold' | 'platinum' | 'diamond';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status:
    | 'active'
    | 'inactive'
    | 'cancelled'
    | 'expired'
    | 'failed'
    | 'pending'
    | 'processing';
  startDate: Date;
  endDate: Date;
  paymentMethodId?: string;
  isDeleted: boolean;
}

export interface TSubscriptionPlan {
  name: string;
  type: 'gold' | 'platinum' | 'diamond';
  duration: number;
  price: number;
  stripePriceId: string;
  features: string[];
  isActive: boolean;
}

const subscriptionSchema = new Schema<TSubscription>(
  {
    contractorId: {
      type: Schema.Types.ObjectId,
      ref: 'Contractor',
      required: true
    },
    planType: {
      type: String,
      enum: ['gold', 'platinum', 'diamond'],
      required: true
    },
    stripeCustomerId: { type: String, required: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        'active',
        'inactive',
        'cancelled',
        'expired',
        'failed',
        'pending',
        'processing'
      ],
      default: 'pending'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentMethodId: { type: String },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({ contractorId: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true });
subscriptionSchema.index({ stripeCustomerId: 1 });

subscriptionSchema.index(
  { contractorId: 1 },
  {
    partialFilterExpression: {
      status: { $in: ['active', 'pending', 'processing'] },
      isDeleted: false
    },
    unique: true,
    name: 'unique_active_subscription_per_contractor'
  }
);

const subscriptionPlanSchema = new Schema<TSubscriptionPlan>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['gold', 'platinum', 'diamond'],
      required: true,
      unique: true
    },
    duration: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    stripePriceId: { type: String, required: true, unique: true },
    features: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

subscriptionPlanSchema.index({ type: 1, isActive: 1 });

export const Subscription = model<TSubscription>(
  'Subscription',
  subscriptionSchema
);
export const SubscriptionPlan = model<TSubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
