/* eslint-disable no-unused-vars */
import { Model, Types } from 'mongoose';

export type TReport = {
  date: Date;
  userId: Types.ObjectId;
  bookingId: Types.ObjectId;
  subjectCategory: string;
  feedback: {
    customerText: string;
    adminText: string;
  };
};

export interface ReportModel extends Model<TReport> {
  isReportExists(id: string): Promise<TReport | null>;
}
