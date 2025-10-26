import { Schema, model } from 'mongoose';
import { TContractor, ContractorModel } from './Contractor.interface';

const contractorSchema = new Schema<TContractor, ContractorModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    experience: { type: String, default: '' },
    bio: { type: String, default: '' },
    city: { type: String, default: '' },
    language: { type: String, default: '' },
    location: { type: String, default: '' },
    rateHourly: { type: Number, default: 0, required: true },
    balance: { type: Number, default: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: 'SubCategory',
    },
    skillsCategory: { type: String, default: '' },
    ratings: { type: Number, required: true, default: 0 },
    skills: { type: Schema.Types.Mixed, required: true, default: [] },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'failed'],
      required: true,
      default: 'inactive'
    },
    stripeCustomerId: { type: String },
    customerId: { type: String, default: '' },
    paymentMethodId: { type: String, default: '' },
    certificates: { type: [String], required: true, default: [] },
    materials: [
      {
        name: { type: String, default: '' },
        unit: { type: String, default: '' },
        price: { type: Number, default: '' }
      }
    ],
    myScheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'MySchedule',
      default: null
    },
    // stripeAccountId: { type: String, default: '' },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    },
    subscriptionEndDate: {
      type: Date,
    },
    subscriptionStartDate: {
      type: Date,
    },
    hasActiveSubscription: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

contractorSchema.statics.isContractorExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

// Add indexes for efficient queries
contractorSchema.index({ userId: 1 });
contractorSchema.index({ stripeAccountId: 1 });
contractorSchema.index({ 'withdrawalHistory.status': 1 });

export const Contractor = model<TContractor, ContractorModel>(
  'Contractor',
  contractorSchema
);
