/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TCustomer = {
  userId: Types.ObjectId;
  dob?: string; 
  gender?: string;
  city?: string;
  language?: string;
  location?: string;
  isDeleted: boolean;
};

export interface CustomerModel extends Model<TCustomer> {
  isCustomerExists(id: string): Promise<TCustomer | null>;
}
