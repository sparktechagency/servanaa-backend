/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type THelp = {
  userId: Types.ObjectId;
  clientMessage: string;
  adminMessage: string;
  isDeleted: boolean;
};

export interface HelpModel extends Model<THelp> {
  isHelpExists(id: string): Promise<THelp | null>;
}
