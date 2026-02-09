/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TLoginUser } from './auth.interface';
import { User } from '../User/user.model';
import AppError from '../../errors/AppError';
import { OtpServices } from '../Otp/otp.service';
import { createToken, verifyToken } from './auth.utils';
import config from '../../config/index';
import { Otp } from '../Otp/otp.model';
import { SendEmail } from '../../utils/sendEmail';

const loginUser = async (payload: TLoginUser) => {
  console.log(payload, 'req.body');

  const user = await User.isUserExistsByCustomEmail(payload.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  if (payload?.requestRole === "superAdmin" && user?.role !== "superAdmin") {
    throw new AppError(httpStatus.FORBIDDEN, 'You are not allowed to login with this role !');
  }


  const otpVerified = user.otpVerified;

  if (!otpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'required otp verify your account!'
    );
  }

  if (user.role === 'contractor' && user?.adminAccept === 'rejected') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your contractor application has been rejected by the admin.'
    );
  }

  if (user.role === 'contractor' && user?.adminAccept === 'pending') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your contractor application is still pending approval from the admin.'
    );
  }

  // checking if the user is already deleted
  const isDeleted = user.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  // checking if the user is blocked
  const userStatus = user?.status;
  console.log(userStatus, 'userStatus--------login service');

  if (userStatus === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked !');
  }

  if (!(await User.isPasswordMatched(payload?.password, user?.password)))
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched');

  //create token and sent to the  client
  const jwtPayload: any = {
    userEmail: user.email,
    role: user.role
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken
    // needsPasswordChange: user?.needsPasswordChange,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  // checking if the user is exist
  const user = await User.isUserExistsByCustomEmail(userData.userEmail);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  //checking if the password is correct
  if (!(await User.isPasswordMatched(payload.oldPassword, user?.password)))
    throw new AppError(httpStatus.FORBIDDEN, 'Password do not matched');

  //hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    {
      email: userData.userEmail,
      role: userData.role
    },
    {
      password: newHashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date()
    }
  );

  return null;
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { userEmail, iat } = decoded;

  // checking if the user is exist
  const user = await User.isUserExistsByCustomEmail(userEmail);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }
  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  // // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked ! !');
  }

  if (
    user.passwordChangedAt &&
    User.isJWTIssuedBeforePasswordChanged(user.passwordChangedAt, iat as number)
  ) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized !');
  }

  const jwtPayload = {
    userEmail: user.email,
    role: user.role
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken
  };
};

const forgetPassword = async (userEmail: string) => {
  // checking if the user is exist
  const user = await User.isUserExistsByCustomEmail(userEmail);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked ! !');
  }

  await OtpServices.generateAndSendOTP(user.email);

  // Return a specific message for the controller
  return {
    message: 'OTP sent successfully!',
    accessToken: null
    // refreshToken: null,
  };

};

const resetPassword = async (
  payload: { email: string; newPassword: string },
  token: string
) => {
  // checking if the user is exist
  const user = await User.isUserExistsByCustomEmail(payload?.email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }
  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted !');
  }

  // checking if the user is blocked
  const userStatus = user?.status;

  if (userStatus === 'blocked') {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is blocked ! !');
  }

  const decoded = jwt.verify(
    token,
    config.jwt_access_secret as string
  ) as JwtPayload;

  //localhost:3000?id=A-0001&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBLTAwMDEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDI4NTA2MTcsImV4cCI6MTcwMjg1MTIxN30.-T90nRaz8-KouKki1DkCSMAbsHyb9yDi0djZU3D6QO4

  if (payload.email !== decoded.userEmail) {
    throw new AppError(httpStatus.FORBIDDEN, 'You are forbidden!');
  }

  //hash new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    {
      email: decoded.userEmail,
      role: decoded.role
    },
    {
      password: newHashedPassword,
      needsPasswordChange: false,
      passwordChangedAt: new Date()
    }
  );
};

const changeEmail = async (oldEmail: string, newEmail: string, otp: number) => {

  const user = await User.isUserExistsByCustomEmail(oldEmail);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found!');
  }

  const newEmailOTP = await Otp.findOne({ email: newEmail })
    .sort({ createdAt: -1 });

  if (!newEmailOTP) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP not found. Please verify your new email first.');
  }

  if (newEmailOTP.otp !== Number(otp)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP. Please try again.');
  }

  const updatedUser = await User.findOneAndUpdate(
    { email: oldEmail },
    { email: newEmail },
    { new: true }
  );

  if (!updatedUser) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update email. Please try again later.');
  }

  await Otp.deleteMany({ email: newEmail });

  await SendEmail.sendChangeEmailNotify(oldEmail, newEmail);

  const jwtPayload = {
    userEmail: updatedUser.email,
    role: updatedUser.role
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken
  };
};
const changeEmailOTP = async (userEmail: string) => {
  const user = await User.isUserExistsByCustomEmail(userEmail);

  if (user) {
    throw new AppError(httpStatus.NOT_FOUND, 'This email is already created with an account, please try with a different email!');
  }

  await OtpServices.generateAndSendOTP(userEmail);

  // Return a specific message for the controller
  return {
    message: 'OTP sent successfully!',
    accessToken: null
    // refreshToken: null,
  };

};

export const AuthServices = {
  loginUser,
  changeEmail,
  changePassword,
  changeEmailOTP,
  refreshToken,
  forgetPassword,
  resetPassword
};
