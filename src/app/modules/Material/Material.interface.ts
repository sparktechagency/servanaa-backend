/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TMaterial = {
  // categoryId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  name: string;
  unit:  number;
  price: number;
  isDeleted: boolean;
};

export interface MaterialModel extends Model<TMaterial> {
  isMaterialExists(id: string): Promise<TMaterial | null>;
}
