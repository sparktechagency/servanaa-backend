import { Schema, model } from 'mongoose';

export interface TSubscription {
  contractorId: Schema.Types.ObjectId;
  planType: 'basic' | 'premium';
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

export interface TPlan {
  planType: 'basic' | 'premium';
  price: number;
  duration: string;
  details: string[];
}

export interface TSubscriptionPlan {
  name: string;
  type: 'basic' | 'premium';
  duration: number;
  price: number;
  stripePriceId: string;
  features: string[];
  serviceAreas: number; // -1 for unlimited
  featuredListing: boolean;
  instantBookingEligibility: boolean;
  multipleStaffAccounts: boolean;
  jobCategories: number; // -1 for all categories
  verifiedBadge: boolean;
  premiumBadge?: boolean;
  insightsDashboard: 'basic' | 'full';
  support: 'standard' | 'priority';
  customerReviewBooster: boolean;
  customBranding: boolean;
  customBrandingPrice: number;
  newCustomerFreeMonths?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
      enum: ['basic', 'premium'],
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
  { contractorId: 1, status: 1 },
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
      enum: ['basic', 'premium'],
      required: true,
      unique: true
    },
    duration: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    stripePriceId: { type: String, required: true, unique: true },
    features: [{ type: String, required: true }],
    serviceAreas: { type: Number, required: true }, // -1 for unlimited
    featuredListing: { type: Boolean, default: false },
    instantBookingEligibility: { type: Boolean, default: false },
    multipleStaffAccounts: { type: Boolean, default: false },
    jobCategories: { type: Number, required: true }, // -1 for all categories
    verifiedBadge: { type: Boolean, default: true },
    premiumBadge: { type: Boolean, default: false },
    insightsDashboard: {
      type: String,
      enum: ['basic', 'full'],
      required: true
    },
    support: {
      type: String,
      enum: ['standard', 'priority'],
      required: true
    },
    customerReviewBooster: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    customBrandingPrice: { type: Number, default: 0 },
    newCustomerFreeMonths: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);
subscriptionPlanSchema.index({ type: 1, isActive: 1 });



const plansSchema = new Schema<TPlan>(
  {
    planType: {
      type: String,
      enum: ['basic', 'premium'],
      required: true
    },
    price: { type: Number, required: true },
    duration: { type: String, required: true, enum: ['Monthly', 'Yearly'] },
    details: { type: [String] },
  },
  {
    timestamps: true
  }
);

export const Plans = model<TPlan>(
  'Plans',
  plansSchema
);

export const Subscription = model<TSubscription>(
  'Subscription',
  subscriptionSchema
);
export const SubscriptionPlan = model<TSubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
