/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TTransaction = {
  amount: string;
  competitionId: Types.ObjectId;
  actorId: Types.ObjectId;
  paymentStatus: 'pending' | 'completed' | 'failed';
  type: 'entry_fee' | 'withdrawal';
  adminPermission: 'pending' | 'approved' | 'rejected';
  isDeleted: boolean;
};

//for creating static
export interface TransactionModel extends Model<TTransaction> {
  isUserExists(id: string): Promise<TTransaction | null>;
}
