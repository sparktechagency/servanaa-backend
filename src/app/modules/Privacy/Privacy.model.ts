import { Schema, model } from 'mongoose';
      import { TPrivacy, PrivacyModel } from './Privacy.interface';
      
      const PrivacySchema = new Schema<TPrivacy, PrivacyModel>({
        description: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      PrivacySchema.statics.isPrivacyExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Privacy = model<TPrivacy, PrivacyModel>('Privacy', PrivacySchema);
      