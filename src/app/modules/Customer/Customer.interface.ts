/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TCustomer = {
  userId: Types.ObjectId;
  dob?: string;
  gender?: string;
  city?: string;
  language?: string;
  location?: string;

  // Add Stripe integration field
  stripeCustomerId?: string;

  // Payment method storage
  paymentMethods?: [
    {
      stripePaymentMethodId: string;
      type: 'card' | 'bank_account';
      last4: string;
      brand?: string;
      isDefault: boolean;
    }
  ];

  // Billing information
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };

  // Customer stats
  totalSpent?: number;
  bookingCount?: number;

  isDeleted: boolean;
};

export interface CustomerModel extends Model<TCustomer> {
  isCustomerExists(id: string): Promise<TCustomer | null>;
}
