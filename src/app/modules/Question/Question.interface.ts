/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TFaq = {
  subCategoryId: Types.ObjectId;
  question: string[];
  isDeleted: boolean;
};

export interface FaqModel extends Model<TFaq> {
  isFaqExists(id: string): Promise<TFaq | null>;
}
  