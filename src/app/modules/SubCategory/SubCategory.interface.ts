/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TSubCategory = {
  categoryId: Types.ObjectId;
  name: string;
  img: string; 
  isDeleted: boolean;
};

export interface SubCategoryModel extends Model<TSubCategory> {
  isSubCategoryExists(id: string): Promise<TSubCategory | null>;
}
