import { Schema, model } from 'mongoose';
      import { TCategory, CategoryModel } from './Category.interface';
      
      const CategorySchema = new Schema<TCategory, CategoryModel>({
        name: { type: String, required: true },
        img: { type: String },
        isDeleted: { type: Boolean, default: false },
      });
      
      CategorySchema.statics.isCategoryExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Category = model<TCategory, CategoryModel>('Category', CategorySchema);
      