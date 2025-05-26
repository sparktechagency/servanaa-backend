/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TTerm = {
  description: string;
  isDeleted: boolean;
};

export interface TermModel extends Model<TTerm> {
  isTermExists(id: string): Promise<TTerm | null>;
}
