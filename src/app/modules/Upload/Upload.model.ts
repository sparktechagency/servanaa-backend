import { Schema, model } from 'mongoose';
import { TUpload, UploadModel } from './Upload.interface';
      
      const UploadSchema = new Schema<TUpload, UploadModel>({
        name: { type: String, required: true },
        description: { type: String },
        atcCodes: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      UploadSchema.statics.isUploadExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Upload = model<TUpload, UploadModel>('Upload', UploadSchema);
      