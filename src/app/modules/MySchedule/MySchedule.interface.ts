/* eslint-disable no-unused-vars */
import { Model, Types} from 'mongoose';

export type TMySchedule = {
  contractorId: Types.ObjectId;
  day: string;
  timeSlots: [string];
  isDeleted: boolean;
};

export interface MyScheduleModel extends Model<TMySchedule> {
  isMyScheduleExists(id: string): Promise<TMySchedule | null>;
}
