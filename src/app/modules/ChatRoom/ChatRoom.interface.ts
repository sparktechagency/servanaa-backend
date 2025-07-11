/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';

export type TChatRoom = {
  participants: string[];
};

export interface ChatRoomModel extends Model<TChatRoom> {
  isChatRoomExists(id: string): Promise<TChatRoom | null>;
}
