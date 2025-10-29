import { Schema, model } from 'mongoose';
import { TSupportModel } from './Contractor.interface';
const supportSchema = new Schema<TSupportModel>(
    {
        userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
        title: {
            type: String,
            required: true
        },
        details: { type: String, required: true },
        adminMessage: { type: String, default: '' },
        status: { type: String }
    },
    { timestamps: true }
);

export const Support = model<TSupportModel>('support', supportSchema);
