/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';
// import { Types } from 'mongoose';
 
export type  TUser = {
  fullName: string;
  email: string;
  password: string;
  contactNo: string; 
  otpVerified: boolean;
  location?: string;
  img?: string;
  role: 'client' | 'superAdmin' | ' ';
  status?: 'active' | 'blocked';
  subscriptionStatus?: boolean;
  customerId?: string;
  paymentMethodId?: string;
  passwordChangedAt?: Date; 
  approvalStatus?: boolean;

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
}



export interface UserModel extends Model<TUser> {
  // Static methods for checking if the user exists
  isUserExistsByCustomEmail(email: string): Promise<TUser | null>;

  // Static method for password comparison
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;

  // Static method to check JWT issuance timing
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number,
  ): boolean;
}
export type TUserRole = keyof typeof USER_ROLE;
