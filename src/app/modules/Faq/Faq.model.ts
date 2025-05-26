import { Schema, model } from 'mongoose';
      import { TFaq, FaqModel } from './Faq.interface';
      
      const FaqSchema = new Schema<TFaq, FaqModel>({
        question: { type: String, required: true },
        answer: { type: String },
        isDeleted: { type: Boolean, default: false },
      });
      
      FaqSchema.statics.isFaqExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Faq = model<TFaq, FaqModel>('Faq', FaqSchema);
      