import { Schema, model } from 'mongoose';
import { TCard, CardModel } from './Card.interface';


const CardSchema = new Schema<TCard, CardModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentMethodId: {
      type: String,
      required: true,
      // unique: true,
    },
    cardBrand: {
      type: String,
      required: true,
    },
    last4: {
      type: String,
      required: true,
      // unique: true,
    },
    expMonth: {
      type: Number,
      required: true,
    },
    expYear: {
      type: Number,
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

CardSchema.statics.isCardExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Card = model<TCard, CardModel>('Card', CardSchema);
