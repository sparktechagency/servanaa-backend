import mongoose, { Schema, model } from 'mongoose';
      import { TChatRoom, ChatRoomModel } from './ChatRoom.interface';
      
      const ChatRoomSchema = new Schema<TChatRoom, ChatRoomModel>({
         participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
         isDeleted: { type: Boolean, default: false },
      }, { timestamps: true, versionKey: false });
      
      ChatRoomSchema.statics.isChatRoomExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const ChatRoom = model<TChatRoom, ChatRoomModel>('ChatRoom', ChatRoomSchema);
      