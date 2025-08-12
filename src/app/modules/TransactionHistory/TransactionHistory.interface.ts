import { Model } from 'mongoose';

export type TTransactionHistory = {
  name: string;
  description?: string;
  atcCodes: string;
  isDeleted: boolean;
};

export interface TransactionHistoryModel extends Model<TTransactionHistory> {
  isTransactionHistoryExists(id: string): Promise<TTransactionHistory | null>;
}
