/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TTransaction = {
  transactionId?: string;
  contractorId: Types.ObjectId;
  customerId?: string;
  bookingId?: Types.ObjectId;
  type: 'booking' | 'withdraw' | 'subscription';
  date: Date;
  paymentStatus: 'pending' | 'paid' | 'rejected';
  amount: number;
  isDeleted: boolean;
};

//for creating static
export interface TransactionModel extends Model<TTransaction> {
  isUserExists(id: string): Promise<TTransaction | null>;
}
