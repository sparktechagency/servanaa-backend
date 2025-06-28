import { Schema, model } from 'mongoose';
import { TMySchedule, MyScheduleModel } from './MySchedule.interface';
import { daysOfWeek } from './MySchedule.constant';
// Schema for each day's schedule
const ScheduleDaySchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: daysOfWeek,
  },
  timeSlots: {
    type: [String], // e.g., ["09:00-10:00", "10:00-11:00"]
    required: true,
  },
});
const MyScheduleSchema = new Schema<TMySchedule, MyScheduleModel>({
  contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', unique:true, required: true, },
 schedules: {
    type: [ScheduleDaySchema], // Array of day + slots
    required: true,
  },
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
