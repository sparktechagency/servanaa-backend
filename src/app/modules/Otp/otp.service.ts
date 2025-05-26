/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Otp } from "./otp.model";
import { SendEmail } from "../../utils/sendEmail";
import { User } from "../User/user.model";
// import config from "../../config";
import { createToken } from "../Auth/auth.utils";
import { Twilio } from "twilio";
import config from "../../config";
// import { UserServices } from "../User/user.service";


const generateAndSendOTP = async (email: any ) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

    // Save OTP to database
    await Otp.create({email, otp });

    // Simulate sending OTP (e.g., SMS or email)
    await SendEmail.sendOTPEmail(email, otp);
    return otp;
};
const generateAndSendOTPToMobile = async (phone: any, email: any) => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
 console.log(otp, email, phone, "otp" ,"email", "phone");
    // Save OTP to database

    await Otp.create({phone, otp, email });


 console.log(otp, "musa next");

    // Create a Twilio client
    const client = new Twilio(config.account_sid, config.auth_token);

    // Use the client to send an SMS message
        try {
            await client.messages.create({
                body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
                from: config.twilio_phone_number,
                to: phone,  // Use the formatted phone number
            });
    
            return 'OTP sent successfully!';
        } catch (error:any) {
            return `Failed to send OTP: ${error.message}`;
        }
    };
const verifyOTP = async (user: any, payload : any) => {
    const { email, otp } = payload;

    const record = await Otp.findOne({ email, otp });

    if (!record) {
        throw new AppError(httpStatus.BAD_REQUEST,  "The OTP is incorrect. Please try again.");  // OTP not found
    }

    // Check expiration (5 minutes)
    const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (Date.now() - new Date(record.createdAt).getTime() > EXPIRATION_TIME) {
      await Otp.deleteOne({ _id: record._id }); // Remove expired OTP
      const otp = await OtpServices.generateAndSendOTP(email);

      if (!otp) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `otp not created`
        );
      }

      return {
        success: false,
        message: "The OTP is expired. Please try again to continue. A new OTP is sent again.",	 
      };
    }


      // // OTP is valid
      await Otp.deleteOne({ _id: record._id }); // Remove used OTP


    //   const userData = await User.findOne({ email });
    //   console.log(userData, 'userData');

    //   if (userData) {
    //     userData.otpVerified = true; // Update the otpVerified field
    //     await userData.save(); // Save the updated user document
    //     console.log('record3');

    //   } else {
    //     throw new AppError(httpStatus.BAD_REQUEST, "User not found.");
    // }

    const result = await User.updateOne(
        { email }, // Filter by email
        { $set: { otpVerified: true } } // Update the otpVerified field
      );
      if (result.modifiedCount === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "User not found.");
      }



  return {
    success: true,    
    message: "OTP verified successfully."};
  // return {resetToken};
};

const otpVeryfyForgetPasswordIntoDB = async ( payload : any) => {
    const { email, otp } = payload;
    const user = await User.findOne({ email });

    const record = await Otp.findOne({ email, otp });

    if (!record) {
        throw new AppError(httpStatus.BAD_REQUEST,  "The OTP is incorrect. Please try again.");  // OTP not found
    }

    // Check expiration (5 minutes)
    const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (Date.now() - new Date(record.createdAt).getTime() > EXPIRATION_TIME) {
      await Otp.deleteOne({ _id: record._id }); // Remove expired OTP
      const otp = await OtpServices.generateAndSendOTP(email);

      if (!otp) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `otp not created`
        );
      }

      return {
        success: false,
        message: "The OTP is expired. Please try again to continue. A new OTP is sent again.",	 
      };
    }

  // // OTP is valid
  await Otp.deleteOne({ _id: record._id }); // Remove used OTP
 
  if(!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found.");
  }

  const jwtPayload:any = {
    userEmail: user.email,
    role: user.role,
  };

  const resetToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    '10m',
  );
    
  return {resetToken};
};
// const otpVerifyForMobileNumberIntoDB = async ( payload : any, user: any) => {
//     const { phone, otp } = payload;
//     console.log('user otp', user);
//     const record = await Otp.findOne({ phone, otp });
//     console.log('record', record);

//     if (!record) {
//         throw new AppError(httpStatus.BAD_REQUEST,  "The OTP is incorrect. Please try again.");  // OTP not found
//     }

//     // Check expiration (5 minutes)
//     const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

//     if (Date.now() - new Date(record.createdAt).getTime() > EXPIRATION_TIME) {
//       await Otp.deleteOne({ _id: record._id }); // Remove expired OTP
//       const otp = await OtpServices.generateAndSendOTPToMobile(phone, user.email);

//       if (!otp) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           `otp not created`
//         );
//       }

//       return {
//         success: false,
//         message: "The OTP is expired. Please try again to continue. A new OTP is sent again.",	 
//       };
//     }

//   // // OTP is valid
//   await Otp.deleteOne({ _id: record._id }); // Remove used OTP

//   // update number of the user
//   //  UserServices.updateUserIntoDB();

//   const userData = await User.isUserExistsByCustomEmail(user.userEmail);
//   if (!userData) {
//     throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
//   }

//   userData.contactNo = record.phone;


//     // 4. Update user’s phone number using findOneAndUpdate
//   const updatedUser = await User.findOneAndUpdate(
//     { email: user.userEmail }, // match condition
//     { contactNo: phone },       // update field
//     { new: true }               // return the updated document
//   );

//   if (!updatedUser) {
//     throw new AppError(httpStatus.NOT_FOUND, "User not found.");
//   }

//   // 5. Return success
//   return {
//     success: true,
//     message: "Phone number verified and updated successfully.",
//     contactNo: updatedUser.contactNo,
//   };

// };
const otpVerifyForMobileNumberIntoDB = async ( payload : any, user: any) => {
    const { phone, otp } = payload;
    console.log('user otp', user);
    const record = await Otp.findOne({ phone, otp });
    console.log('record', record);

    if (!record) {
        throw new AppError(httpStatus.BAD_REQUEST,  "The OTP is incorrect. Please try again.");  // OTP not found
    }

    // Check expiration (5 minutes)
    const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (Date.now() - new Date(record.createdAt).getTime() > EXPIRATION_TIME) {
      await Otp.deleteOne({ _id: record._id }); // Remove expired OTP
      const otp = await OtpServices.generateAndSendOTPToMobile(phone, user.email);

      if (!otp) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `otp not created`
        );
      }

      return {
        success: false,
        message: "The OTP is expired. Please try again to continue. A new OTP is sent again.",	 
      };
    }

  // // OTP is valid
  await Otp.deleteOne({ _id: record._id }); // Remove used OTP

  // update number of the user
  //  UserServices.updateUserIntoDB();

  const userData = await User.isUserExistsByCustomEmail(user.userEmail);
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, 'This user is not found !');
  }

  userData.contactNo = record.phone;


    // 4. Update user’s phone number using findOneAndUpdate
  const updatedUser = await User.findOneAndUpdate(
    { email: user.userEmail }, // match condition
    { contactNo: phone },       // update field
    { new: true }               // return the updated document
  );

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  // 5. Return success
  return {
    success: true,
    message: "Phone number verified and updated successfully.",
    contactNo: updatedUser.contactNo,
  };

};

export const OtpServices = {
    generateAndSendOTP,
    verifyOTP,
    otpVeryfyForgetPasswordIntoDB,
    generateAndSendOTPToMobile,
    otpVerifyForMobileNumberIntoDB
    
};
