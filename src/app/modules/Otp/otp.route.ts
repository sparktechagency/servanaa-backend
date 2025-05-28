import express from 'express';
import { OtpControllers } from './otp.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/verify',
  OtpControllers.otpVeryfy,
);
router.post(
  '/verify-forget-password',
  OtpControllers.otpVeryfyForgetPassword,
);
router.post(
  '/verify-mobile-number',
  auth(USER_ROLE.superAdmin,  USER_ROLE.customer,  USER_ROLE.contractor), 
  OtpControllers.otpVerifyForMobileNumber,
);
router.post(
  '/generate-otp',
  OtpControllers.generateOtp,
);

export const OtpRoutes = router;
