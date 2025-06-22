import { Schema, model } from 'mongoose';
      import { TContractor, ContractorModel } from './Contractor.interface';


const contractorSchema = new Schema<TContractor, ContractorModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    dob: { type: String },
    gender: { type: String },
    city: { type: String },
    language: { type: String },
    location: { type: String, default: '' },

    
    rateHourly: { type: Number, default: 0, required: true },
    skillsCategory: { type: String, default: '' },
    ratings: { type: Number, required: true, default: 0 },
    skills: { type: Schema.Types.Mixed, required: true, default: [] }, // string or array of strings
    subscriptionStatus: {
      type: String,
      enum: ['pending', 'active', 'failed', 'cancelled', 'paused'],
      required: true,
      default: 'pending'
    },
    customerId: { type: String,  default: '' },
    paymentMethodId: { type: String, default: '' },
    certificates: { type: [String], required: true, default: [] },
    materials: { type: [String], required: true, default: [] },
    mySchedule: [
      {
        day: { type: String },
        startTime: { type: String},
        endTime: { type: String },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
      
      contractorSchema.statics.isContractorExists = async function (id: string) {
        return await this.findOne({ _id: id, isDeleted: false });
      };
      
      export const Contractor = model<TContractor, ContractorModel>('Contractor', contractorSchema);
      