/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TChat = {
  chatRoomId: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  message: string;
  image?: string;
  isRead: boolean;
}

export interface ChatModel extends Model<TChat> {
  isChatExists(id: string): Promise<TChat | null>;
}
