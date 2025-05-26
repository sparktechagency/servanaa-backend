/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';
// import { Types } from 'mongoose';
 
export type  TUser = {
  fullName: string;
  bio?: string;
  address?: string;
  contactNo?: string; 
  email: string;
  password: string;
  customerId?: string;
  img?: string;
  myBalance?: {          
    deposit?: number;         
    refund?: number;
  };  
  // preference?: Types.ObjectId;
  location?: string;
  passwordChangedAt?: Date; 
  approvalStatus: boolean;
  language?: string;
  experience?: string;
  services?: {
    requiredTasks: string | string[]; // Array of strings for the requiredTasks
    specialistsIn: string | string[]; // Array of strings for the requiredTasks
  };
  skills?: string | string[];
  otpVerified: boolean;
  dob?: string;
  role: 'client' | 'superAdmin' | ' ';
  status?: 'active' | 'blocked';
  isDeleted: boolean;
   minimumBookingAmount?: number; 
  workArea?: {
    coordinates: {
      type: 'Point'; 
      latitude: number; // Latitude for the work area location
      longitude: number; // Longitude for the work area location
    };
    mapLink: string; // Google Maps URL link to show the work area location
  };
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
