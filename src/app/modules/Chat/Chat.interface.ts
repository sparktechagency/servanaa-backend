/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TChat = {
  chatRoomId: any;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  image?: string;
  isRead: boolean;
  createdAt?: Date; // <-- add this
  updatedAt?: Date; // <-- optional but recommended
}

export interface ChatModel extends Model<TChat> {
  isChatExists(id: string): Promise<TChat | null>;
}
