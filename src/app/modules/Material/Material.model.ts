import { Schema, model } from 'mongoose';
      import { TMaterial, MaterialModel } from './Material.interface';
      
      const MaterialSchema = new Schema<TMaterial, MaterialModel>({
        name: { type: String, required: true },
        unit: { type: Number, required: true },
        price: { type: Number, required: true },
        isDeleted: { type: Boolean, default: false },
      });
      
      MaterialSchema.statics.isMaterialExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Material = model<TMaterial, MaterialModel>('Material', MaterialSchema);
      