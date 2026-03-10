import { Schema, model } from 'mongoose';
import { TSubCategory, SubCategoryModel } from './SubCategory.interface';

const SubCategorySchema = new Schema<TSubCategory, SubCategoryModel>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: { type: String, required: true, trim: true },
    img: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

SubCategorySchema.statics.isSubCategoryExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

// Ensure uniqueness of (categoryId, name) in a case-insensitive way.
// Collation with strength:2 makes the index case-insensitive for typical Latin scripts.
SubCategorySchema.index({ categoryId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const SubCategory = model<TSubCategory, SubCategoryModel>(
  'SubCategory',
  SubCategorySchema
);
