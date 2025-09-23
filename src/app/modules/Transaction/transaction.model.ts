import { model, Schema } from 'mongoose';
import { TransactionModel, TTransaction } from './transaction.interface';


const transactionSchema: Schema = new Schema<TTransaction>(
   {
    transactionId: { type: String, unique: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: String },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    type: {
      type: String,
      enum: ['booking', 'withdraw', 'subscription'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'rejected'],
      required: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
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
