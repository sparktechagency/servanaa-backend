import { Schema, model } from 'mongoose';
      import { THelp, HelpModel } from './Help.interface';
      
      const HelpSchema = new Schema<THelp, HelpModel>({
        userId: {type: Schema.Types.ObjectId, ref: "User", required: true },
        clientMessage: { type: String, required: true },
        adminMessage: { type: String },
        isDeleted: { type: Boolean, default: false },
      });
      
      HelpSchema.statics.isHelpExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Help = model<THelp, HelpModel>('Help', HelpSchema);
      