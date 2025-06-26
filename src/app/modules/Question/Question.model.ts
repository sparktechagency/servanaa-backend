import { Schema, model } from 'mongoose';
      import { TFaq, FaqModel } from './Question.interface';
      
      const FaqSchema = new Schema<TFaq, FaqModel>({
        question: { type: [String], required: true },
        subCategoryId: { type: Schema.Types.ObjectId, ref: "SubCategory", required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      FaqSchema.statics.isFaqExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Faq = model<TFaq, FaqModel>('Question', FaqSchema);
      