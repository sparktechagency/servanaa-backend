import { Schema, model } from 'mongoose';
      import { TAbout, AboutModel } from './About.interface';
      
      const AboutSchema = new Schema<TAbout, AboutModel>({
        description: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      AboutSchema.statics.isAboutExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const About = model<TAbout, AboutModel>('About', AboutSchema);
      