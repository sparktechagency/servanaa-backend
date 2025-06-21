import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { OtpServices } from './otp.service';
import sendResponse from '../../utils/sendResponse';


const otpVeryfy = catchAsync(async (req, res) => {
  const otp = req.body;
  const result = await OtpServices.verifyOTP(req.user, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully.',
    data: result,
  });
});

const otpVeryfyForgetPassword = catchAsync(async (req, res) => {
  const { Otp: otpData } = req.body;
  const result = await OtpServices.otpVeryfyForgetPasswordIntoDB(otpData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully. ',
    data: result,
  });
});

const otpVerifyForMobileNumber = catchAsync(async (req, res) => {
  const { Otp: otpData } = req.body;
  const result = await OtpServices.otpVerifyForMobileNumberIntoDB(otpData, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'OTP verified successfully. ',
    data: result,
  });
});

const generateOtp = catchAsync(async (req, res) => {
  const otpData = req.body;

  const result = await OtpServices.generateAndSendOTP( otpData?.email);
  // const result = await OtpServices.generateAndSendOTP(req.user, otpData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Created OTP Successfully.',
    // message: result?.message  ||  'Created OTP Successfully.',
    data: result,
  });

});


export const OtpControllers = {
  otpVeryfy,
  generateOtp,
  otpVeryfyForgetPassword,
  otpVerifyForMobileNumber
};