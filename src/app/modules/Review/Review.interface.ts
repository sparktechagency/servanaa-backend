/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TReview = {
  customerId: Types.ObjectId;
  contractorId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  description?: string;
  stars: number;
  isDeleted: boolean;
};

export interface ReviewModel extends Model<TReview> {
  isReviewExists(id: string): Promise<TReview | null>;
}
