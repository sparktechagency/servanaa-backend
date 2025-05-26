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
    contactNo: {
      type: String,
    },
    approvalStatus: { type: Boolean, default: false },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    bio: { type: String },
    // preferences: { type: Schema.Types.ObjectId, ref: 'Preference', required: false },
    // preference: { type: Schema.Types.ObjectId, ref: 'Preference' },

    experience: { type: String },
    customerId: { type: String },
    location: { type: String },
    myBalance: {
      deposit: {
        type: Number,
        // required: true,
        default: 0,
      },
      refund: {
        type: Number,
        default: 0,
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['client', 'superAdmin', 'provider'],
      default: 'client',
    },
    dob: { type: String },
    address: { type: String },
    language: { type: String },
    img: {
      type: String,
      default: '',
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    mySchedule: [
      {
        day: { type: String },
        startTime: { type: String },
        endTime: { type: String },
      },
    ],
    minimumBookingAmount: { type: Number, default: 0 },
    // workArea: {
    //   coordinates: {
    //     latitude: { type: Number, required: false },
    //     longitude: { type: Number, required: false },
    //   },
    //   mapLink: { type: String },
    // },
    workArea: {
      type: {
        coordinates: {
          latitude: { type: Number, required: false },
          longitude: { type: Number, required: false },
        },
        mapLink: { type: String },
      },
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const user = this; // doc
  user.password = await bcrypt.hash(
    user.password,
    Number(config.bcrypt_salt_rounds),
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
  hashedPassword,
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimestamp: Date,
  jwtIssuedTimestamp: number,
) {
  const passwordChangedTime =
    new Date(passwordChangedTimestamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

export const User = model<TUser, UserModel>('User', userSchema);
