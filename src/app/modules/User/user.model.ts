/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-this-alias */
import bcrypt from 'bcrypt';
import { Schema, model } from 'mongoose';
import { TUser, UserModel } from './user.interface';
import { UserStatus } from './user.constant';
import config from '../../config/index';

const userSchema = new Schema<TUser, UserModel>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    stripeAccountId: { type: String },
    customerId: { type: String },
    contactNo: { type: String, required: true },
    otpVerified: { type: Boolean, default: false },
    img: { type: String, default: '' },
    role: {
      type: String,
      enum: ['customer', 'superAdmin', 'contractor'],
      required: true,
      default: 'customer'
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      // enum: ['active', 'blocked'],
      default: 'active'
    },
    passwordChangedAt: { type: Date, required: true, default: Date.now },
    contractor: { type: Schema.Types.ObjectId, ref: 'Contractor' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

userSchema.virtual('archieves', {
  ref: 'Archieve',
  localField: '_id',
  foreignField: 'archieveCategoryId', // exact field name in ThingToKnow schema
  justOne: false
});

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  //   if (!this.isModified('password')) {
  //   return next();
  // }
  const user = this; // doc
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

// set '' after saving password
userSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

userSchema.statics.isUserExistsByCustomEmail = async function (email: string) {
  return await User.findOne({ email }).select('+password');
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword,
  hashedPassword
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>('User', userSchema);
