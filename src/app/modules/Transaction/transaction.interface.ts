// /* eslint-disable no-unused-vars */
// import { Model, Types } from 'mongoose';

// export type TTransaction = {
//   transactionId: string;
//   contractorId: Types.ObjectId;
//   contractorName: string;
//   type: 'gold' | 'platinum' | 'Diamond';
//   date: Date;
//   paymentStatus: 'pending' | 'paid' | 'failed';
//   amount: number;
//   isDeleted: boolean;
// };

// //for creating static
// export interface TransactionModel extends Model<TTransaction> {
//   isUserExists(id: string): Promise<TTransaction | null>;
// }
