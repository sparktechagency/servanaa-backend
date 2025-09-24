import { Schema, model } from 'mongoose';
import { TSubCategory, SubCategoryModel } from './SubCategory.interface';

const SubCategorySchema = new Schema<TSubCategory, SubCategoryModel>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: { type: String, required: true, unique: true },
    img: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SubCategorySchema.statics.isSubCategoryExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const SubCategory = model<TSubCategory, SubCategoryModel>(
  'SubCategory',
  SubCategorySchema
);
