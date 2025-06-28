/* eslint-disable no-unused-vars */
import { Model, Types} from 'mongoose';

// One day's schedule
export type TScheduleDay = {
  day: string; // e.g., "Monday"
  timeSlots: string[]; // e.g., ["09:00-10:00", "10:00-11:00"]
};

export type TMySchedule = {
  contractorId: Types.ObjectId;
  schedules: TScheduleDay[]; // Array of days and slots
  isDeleted: boolean;
};

export interface MyScheduleModel extends Model<TMySchedule> {
  isMyScheduleExists(id: string): Promise<TMySchedule | null>;
}
