import { Schema, model } from 'mongoose';
import { TCustomer, CustomerModel } from './Customer.interface';

const CustomerSchema = new Schema<TCustomer, CustomerModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dob: { type: String, default: '' },
    gender: { type: String, default: '' },
    city: { type: String, default: '' },
    language: { type: String, default: '' },
    location: { type: String, default: '' },

    // Add Stripe integration
    stripeCustomerId: { type: String, index: true },

    // Payment methods
    paymentMethods: [
      {
        stripePaymentMethodId: { type: String, required: true },
        type: { type: String, enum: ['card', 'bank_account'], required: true },
        last4: { type: String, required: true },
        brand: { type: String },
        isDefault: { type: Boolean, default: false }
      }
    ],

    // Billing address
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: 'US' }
    },

    // Customer statistics
    totalSpent: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

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
