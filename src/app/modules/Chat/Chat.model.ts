import { Schema, model } from 'mongoose';
import { ChatModel, TChat } from './Chat.interface';

const ChatSchema = new Schema<TChat, ChatModel>(
  {
    chatRoomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    image: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatSchema.statics.isChatExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Chat = model<TChat, ChatModel>('Chat', ChatSchema);
