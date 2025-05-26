import { Schema, model } from 'mongoose';
      import { TTerm, TermModel } from './Term.interface';
      
      const TermSchema = new Schema<TTerm, TermModel>({
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
      });
      
      TermSchema.statics.isTermExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Term = model<TTerm, TermModel>('Term', TermSchema);
      