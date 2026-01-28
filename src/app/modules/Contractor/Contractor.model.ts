import { Schema, model } from 'mongoose';
import { TContractor, ContractorModel } from './Contractor.interface';

const locationSchema = new Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], required: true },
  address: { type: String, required: true },
  street: {
    type: String,
    default: '',
  },
  suburb: {
    type: String,
  },
  state: {
    type: String,
  },
  postcode: {
    type: String,
  },
  direction: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: '',
  },
});

const materialSchema = new Schema({
  name: { type: String, required: true },
  unit: { type: String, default: '' },
  price: { type: Number, default: 0 }
});

const contractorSchema = new Schema<TContractor, ContractorModel>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  dob: { type: String, default: '' },
  isHomeSelect: { type: Boolean },
  gender: { type: String, default: '' },
  marital_status: { type: String, default: '' },
  experience: { type: String, default: '' },
  bio: { type: String, default: '' },
  city: { type: String, default: '' },
  language: { type: String, default: '' },
  location: { type: locationSchema },
  rateHourly: { type: Number, default: 0, required: true },
  balance: { type: Number, default: 0 },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: false },
  subCategory: { type: [Schema.Types.ObjectId], ref: 'SubCategory' },
  skillsCategory: { type: String, default: '' },
  ratings: { type: Number, required: true, default: 0 },
  skills: { type: [String], required: true, default: [] },
  materials: { type: [materialSchema], default: [] },
  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled', 'expired', 'failed'], default: 'inactive' },
  certificates: { type: [String], default: [] },
  myScheduleId: { type: Schema.Types.ObjectId, ref: 'MySchedule', default: null },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', default: null },
  subscriptionEndDate: { type: Date },
  subscriptionStartDate: { type: Date },
  hasActiveSubscription: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Add indexes
contractorSchema.index({ location: '2dsphere' });
contractorSchema.index({ userId: 1 });
contractorSchema.index({ 'withdrawalHistory.status': 1 });

contractorSchema.statics.isContractorExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Contractor = model<TContractor, ContractorModel>('Contractor', contractorSchema);
