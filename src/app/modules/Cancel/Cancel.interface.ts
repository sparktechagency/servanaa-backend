/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TCancel = {
  charge: number;
  description: string;
  message: string;
  isDeleted: boolean;
};

export interface CancelModel extends Model<TCancel> {
  isCancelExists(id: string): Promise<TCancel | null>;
}
