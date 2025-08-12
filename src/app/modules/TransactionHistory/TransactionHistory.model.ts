import { Schema, model } from 'mongoose';
      import { TTransactionHistory, TransactionHistoryModel } from './TransactionHistory.interface';
      
      const TransactionHistorySchema = new Schema<TTransactionHistory, TransactionHistoryModel>({
        name: { type: String, required: true },
        description: { type: String },
        atcCodes: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      TransactionHistorySchema.statics.isTransactionHistoryExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const TransactionHistory = model<TTransactionHistory, TransactionHistoryModel>('TransactionHistory', TransactionHistorySchema);
      