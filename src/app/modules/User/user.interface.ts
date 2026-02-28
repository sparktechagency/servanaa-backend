import { Model, Types } from 'mongoose';
import { USER_ROLE } from './user.constant';

export type TUser = {
  fullName: string;
  customer?: Types.ObjectId;
  contractor?: Types.ObjectId;
  stripeAccountId?: string;
  email: string;
  password: string;
  customerId?: string;
  contactNo: string;
  messageId?: Types.ObjectId;
  otpVerified: boolean;
  img?: string;
  role: 'customer' | 'superAdmin' | 'contractor';
  adminAccept: 'approved' | 'pending' | 'rejected';
  status: 'active' | 'blocked';
  passwordChangedAt: Date;
  isDeleted: boolean;
  cardData?: {
    cardNumber?: string;
    expiryDate: string; 
    cardHolderName?: string;
    cvc?: string;
  };
};
export interface UserModel extends Model<TUser> { 
  isUserExistsByCustomEmail(email: string): Promise<TUser | null>; 
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>; 
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimestamp: Date,
    jwtIssuedTimestamp: number
  ): boolean;
}
export type TUserRole = keyof typeof USER_ROLE;
