/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TAbout = {
  description: string;
  isDeleted: boolean;
};

export interface AboutModel extends Model<TAbout> {
  isAboutExists(id: string): Promise<TAbout | null>;
}
