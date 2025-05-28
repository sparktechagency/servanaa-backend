/* eslint-disable no-unused-vars */
import { Model } from 'mongoose';
import { USER_ROLE } from './user.constant';
 
export type  TUser = {
  fullName: string;
  email: string;
  password: string;
  contactNo: string; 
  otpVerified: boolean;
  img?: string;
  role: 'customer' | 'superAdmin' | 'contractor';
  status: 'active' | 'blocked';
  passwordChangedAt: Date; 
  isDeleted: boolean;
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
