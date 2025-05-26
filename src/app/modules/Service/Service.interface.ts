/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TService = {
  requiredTasks: string ;
  showSpecialists: string;
  isDeleted: boolean;
};

export interface ServiceModel extends Model<TService> {
  isServiceExists(id: string): Promise<TService | null>;
}
