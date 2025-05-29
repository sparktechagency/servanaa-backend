/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TMaterial = {
  name: string;
  unit:  number;
  price: number;
  isDeleted: boolean;
};

export interface MaterialModel extends Model<TMaterial> {
  isMaterialExists(id: string): Promise<TMaterial | null>;
}
