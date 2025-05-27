import { Model, Types } from 'mongoose';

export type TCustomer = {
  userId: Types.ObjectId;
  dob?: string;
  gender?: string;
  city?: string;
  isDeleted: boolean;
  language?: string;
  services?: {
    requiredTasks: string | string[]; // Array of strings for the requiredTasks
    specialistsIn: string | string[]; // Array of strings for the requiredTasks
  };
  rateHourly?: number;
  ratings?: number;
  skills?: string | string[];
  certificate?: string[];
  materials?: string[];
  skillsCategory?: string;
    mySchedule: {
    day?: string; // The day of the week (e.g., "Monday")
    startTime?: { type: string},
    endTime?: { type: string},
  }[];
};

export interface CustomerModel extends Model<TCustomer> {
  isCustomerExists(id: string): Promise<TCustomer | null>;
}
