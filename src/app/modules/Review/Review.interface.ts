/* eslint-disable no-unused-vars */
import { Model , Types} from 'mongoose';

export type TReview = {
  userName: string;
  userImg: string;
  clientId: Types.ObjectId;
  providerId: Types.ObjectId;
  description?: string;
  improveText?: string[];
  star: number;
  isDeleted: boolean;
};

export interface ReviewModel extends Model<TReview> {
  isReviewExists(id: string): Promise<TReview | null>;
}
