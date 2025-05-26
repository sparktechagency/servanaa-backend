/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TFaq = {
  question: string;
  answer: string;
  isDeleted: boolean;
};

export interface FaqModel extends Model<TFaq> {
  isFaqExists(id: string): Promise<TFaq | null>;
}
