// import { model, Schema } from 'mongoose';
// import { TransactionModel, TTransaction } from './transaction.interface';


// const transactionSchema: Schema = new Schema<TTransaction>(
//   {
//     transactionId: { type: String, required: true, unique: true },
//     contractorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     contractorName: { type: String, required: true },
//     amount: { type: Number, required: true },
//     type: {
//       type: String,
//       enum: ['gold', 'platinum', 'Diamond'],
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'paid', 'failed'],
//       default: 'pending',
//     },
//     date: {
//       type: Date,
//       default: Date.now,
//     },
//     isDeleted: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// // Query Middleware
// transactionSchema.pre('find', function (next) {
//   this.find({ isDeleted: { $ne: true } });
//   next();
// });

// transactionSchema.pre('findOne', function (next) {
//   this.find({ isDeleted: { $ne: true } });
//   next();
// });

// transactionSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
//   next();
// });

// //creating a custom static method
// transactionSchema.statics.isparticipationExists = async function (
//   id: string,
// ) {
//   const existingParticipation = await Transaction.findOne({ id });
//   return existingParticipation;
// };

// export const Transaction = model<TTransaction, TransactionModel>(
//   'Transaction',
//   transactionSchema,
// );
