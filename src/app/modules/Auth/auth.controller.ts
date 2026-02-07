import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { AuthServices } from './auth.service';
import config from '../../config/index';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';

const loginUser = catchAsync(async (req, res) => {
  console.log('teeeeeeeee');
  const result = await AuthServices.loginUser(req.body);

  const { refreshToken, accessToken } = result;
  // const { refreshToken, accessToken, needsPasswordChange } = result;

  res.cookie('refreshToken', refreshToken, {
    secure: config.NODE_ENV === 'production',
    // secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24 * 365
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User is logged in succesfully!',
    data: {
      accessToken
      // needsPasswordChange,
    }
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { ...passwordData } = req.body;
  const result = await AuthServices.changePassword(req.user, passwordData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password is updated succesfully!',
    data: result
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await AuthServices.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Refresh token is retrieved succesfully!',
    data: result
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const userEmail = req.body.email;
  const result = await AuthServices.forgetPassword(userEmail);

  // const { message } = result;
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || 'Token generated succesfully!',
    // message: result?.otp ? 'OTP sent succesfully!' : 'Token generated succesfully!',
    data: result
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Something went wrong !');
  }
  const result = await AuthServices.resetPassword(req.body, token);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password reset succesfully! Please login',
    data: result
  });
});


const changeEmail = catchAsync(async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Something went wrong !');
  }
  const result = await AuthServices.changeEmail(req.body?.oldEmail, req.body?.newEmail, req.body?.otp);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Email changed successfully!',
    data: result
  });
});



export const AuthControllers = {
  changeEmail,
  loginUser,
  changePassword,
  refreshToken,
  forgetPassword,
  resetPassword
};
