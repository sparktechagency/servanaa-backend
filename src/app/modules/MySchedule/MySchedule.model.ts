import { Schema, model } from 'mongoose';
import { TMySchedule, MyScheduleModel } from './MySchedule.interface';
import { daysOfWeek } from './MySchedule.constant';

const MyScheduleSchema = new Schema<TMySchedule, MyScheduleModel>({
  contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor' },
  day: {
    type: String,
    required: true,
    enum: daysOfWeek,
  },
  timeSlots: { type: [String], required: true },
  isDeleted: { type: Boolean},
}, {
  timestamps: true,
});

MyScheduleSchema.statics.isMyScheduleExists = async function (id: string) {
  return await this.findOne({ _id: id, isDeleted: false });
};

export const MySchedule = model<TMySchedule, MyScheduleModel>(
  'MySchedule',
  MyScheduleSchema,
);
