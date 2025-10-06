import { Schema, model } from 'mongoose';
import { TCustomer, CustomerModel } from './Customer.interface';

const CustomerSchema = new Schema<TCustomer, CustomerModel>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  dob: { type: String, default: '' },
  gender: { type: String, default: '' },
  city: { type: String, default: '' },
  language: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  location: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false }
});

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Check if a customer exists with given id and is not deleted.
 * @param {string} id - Customer ID

/*******  9b934d55-fdf4-4909-aa39-74289fdcbdb0  *******/
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
