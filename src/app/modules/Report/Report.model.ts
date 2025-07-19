import { Schema, model } from 'mongoose';
import { TReport, ReportModel } from './Report.interface';

const ReportSchema = new Schema<TReport, ReportModel>(
  {
    date: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    subjectCategory: { type: String, required: true },
    feedback: {
      customerText: { type: String, required: true },
      adminText: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

ReportSchema.statics.isReportExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const Report = model<TReport, ReportModel>('Report', ReportSchema);
