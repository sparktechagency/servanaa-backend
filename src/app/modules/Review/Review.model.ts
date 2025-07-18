import { Schema, model } from 'mongoose';
      import { TReview, ReviewModel } from './Review.interface';

      const ReviewSchema = new Schema<TReview, ReviewModel>({
        customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
        contractorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
        stars: { type: Number, required: true },
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
      }, { timestamps: true });
      
      ReviewSchema.statics.isReviewExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Review = model<TReview, ReviewModel>('Review', ReviewSchema);
      