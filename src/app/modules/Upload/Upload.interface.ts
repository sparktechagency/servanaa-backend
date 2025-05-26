/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TUpload = {
  name: string;
  description?: string;
  atcCodes: string;
  isDeleted: boolean;
};

export interface UploadModel extends Model<TUpload> {
  isUploadExists(id: string): Promise<TUpload | null>;
}
