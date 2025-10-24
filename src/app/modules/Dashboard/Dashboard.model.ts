import { Schema, model, Types } from 'mongoose';

type TBanner = {
    image: string;
    category: Types.ObjectId;
    subCategory?: Types.ObjectId;
    type: string;
};

type TCost = {
    cost: number;
};

const BannerSchema = new Schema<TBanner>(
    {
        image: { type: String, required: true },
        category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        subCategory: { type: Schema.Types.ObjectId, ref: "SubCategory" },
        type: { type: String, required: true },
    },
    { timestamps: true }
);

const costAdminSchema = new Schema<TCost>(
    {
        cost: { type: Number, required: true },
    },
    { timestamps: true }
);

export const CostAdmin = model<TCost>('CostAdmin', costAdminSchema);
export const Banner = model<TBanner>('Banner', BannerSchema);
