/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TCategory = {
  name: string;
  img: string; 
  isDeleted: boolean;
};

export interface CategoryModel extends Model<TCategory> {
  isCategoryExists(id: string): Promise<TCategory | null>;
}
