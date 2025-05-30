import { Schema, model } from 'mongoose';
      import { TCancel, CancelModel } from './Cancel.interface';
      
      const CancelSchema = new Schema<TCancel, CancelModel>({
        charge: { type: Number, required: true },
        description: { type: String },
        message: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      },{ timestamps: true });
      
      CancelSchema.statics.isCancelExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Cancel = model<TCancel, CancelModel>('Cancel', CancelSchema);
      