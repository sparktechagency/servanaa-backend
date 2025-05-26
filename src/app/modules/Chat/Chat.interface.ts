/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TChat = {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  image?: string;
  isRead: boolean;
  createdAt: Date;
  isDeleted: boolean;
}

export interface ChatModel extends Model<TChat> {
  isChatExists(id: string): Promise<TChat | null>;
}
