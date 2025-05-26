import { model, Schema } from 'mongoose';
import { TransactionModel, TTransaction } from './transaction.interface';


const transactionSchema: Schema = new Schema<TTransaction>(
  {
    competitionId: {
      type: Schema.Types.ObjectId,
      ref: 'Competition',
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'Actor', required: true },
    amount: { type: String, required: true },
    type: {
      type: String,
      enum: ['entry_fee', 'withdrawal'],
      default: 'entry_fee',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    adminPermission: {
      type: String,
      enum: ['pending', 'approved', 'rejected' ],
      default: 'pending',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Query Middleware
transactionSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

transactionSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

transactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

//creating a custom static method
transactionSchema.statics.isparticipationExists = async function (
  id: string,
) {
  const existingParticipation = await Transaction.findOne({ id });
  return existingParticipation;
};

export const Transaction = model<TTransaction, TransactionModel>(
  'Transaction',
  transactionSchema,
);
