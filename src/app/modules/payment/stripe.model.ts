import { Schema, model, Document } from 'mongoose';


export interface TWithdraw extends Document {
    userId: Schema.Types.ObjectId;
    payoutId: string;
    amount: number;
    date: Date;
    status: 'received' | 'requested' | 'rejected';
}

const WithdrawSchema = new Schema<TWithdraw>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        payoutId: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true },
        status: {
            type: String,
            enum: ['received', 'requested', 'rejected'],
            default: 'requested',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


export const Withdraw = model<TWithdraw>('Withdraw', WithdrawSchema);
