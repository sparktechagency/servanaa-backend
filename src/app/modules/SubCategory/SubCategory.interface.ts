/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TSubCategory = {
  name: string;
  img: string; 
  isDeleted: boolean;
};

export interface SubCategoryModel extends Model<TSubCategory> {
  isSubCategoryExists(id: string): Promise<TSubCategory | null>;
}
