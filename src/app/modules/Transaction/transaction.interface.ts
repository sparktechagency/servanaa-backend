/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TTransaction = {
  transactionId?: string;
  subscriptionId: Types.ObjectId;
  receipt_url: string;
  refundId: string;
  userId: Types.ObjectId;
  //   contractorId: Types.ObjectId;
  //   customerId?: string;
  bookingId?: Types.ObjectId;
  type: 'booking' | 'withdraw' | 'subscription';
  date: Date;
  paymentStatus: 'pending' | 'paid' | 'rejected' | 'refunded';
  amount: number;
  isDeleted: boolean;
};

//for creating static
export interface TransactionModel extends Model<TTransaction> {
  isUserExists(id: string): Promise<TTransaction | null>;
}
