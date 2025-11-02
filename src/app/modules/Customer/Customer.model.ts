import { Schema, model } from 'mongoose';
import { TCustomer, CustomerModel } from './Customer.interface';

const locationSchema = new Schema({
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  street: {
    type: String,
  },
  direction: {
    type: String,
  },
  unit: {
    type: String,
  },
  name: {
    type: String,
    enum: ["Default", 'Home', 'Work', 'Other'],
    required: true,
  },
  isSelect: {
    type: Boolean,
    default: false,
  }
});

const CustomerSchema = new Schema<TCustomer, CustomerModel>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
  city: { type: String, default: '' },
  language: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  ratings: { type: Number, default: 0 },
  location: { type: [locationSchema], required: true },
  isDeleted: { type: Boolean, default: false },
});

CustomerSchema.statics.isCustomerExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

// Add indexes for efficient queries
CustomerSchema.index({ stripeCustomerId: 1 });
CustomerSchema.index({ userId: 1 });

export const Customer = model<TCustomer, CustomerModel>(
  'Customer',
  CustomerSchema
);
