/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';
// paymentMethodId
export type TCard = {
  userId: Types.ObjectId;
  paymentMethodId: string,
  cardBrand: string,
  last4: string,
  expMonth: number,
  expYear: number,
  isDeleted: boolean;
};
 
export interface CardModel extends Model<TCard> {
  isCardExists(id: string): Promise<TCard | null>;
}
