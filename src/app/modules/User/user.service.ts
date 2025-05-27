/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from 'mongoose';


import httpStatus from 'http-status';
import { TUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { usersSearchableFields } from './user.constant';
import AppError from '../../errors/AppError';

import config from '../../config';
import { OtpServices } from '../Otp/otp.service';
import { createToken } from '../Auth/auth.utils';
import { Contractor } from '../Contractor/Contractor.model';


// export const addMobileNumberIntoDB = async (phoneNumber: any, user: any) => {

//      if (!phoneNumber) {
//         return 'Phone number is required.'
//       }

//     const result = await OtpServices.generateAndSendOTPToMobile(phoneNumber?.phone, user?.userEmail);

//     return result;
// };

export const createCustomerIntoDB = async (payload: TUser) => {
   payload.role = payload.role || 'client'

  // Handle file upload if present
  // if (file) {
  //   payload.profileImg = file?.location;
  // }

    const newUser = await User.create(payload);
    if (!newUser) throw new Error('Failed to create user'); 
    


  //create token and sent to the  client
  const jwtPayload:any = {
    userEmail: newUser.email,
    role: newUser.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    newUser
  };
};
export const createContractorIntoDB = async (payload: any) => {
   

    const userData = await User.isUserExistsByCustomEmail(payload.email);
    if (userData) throw new Error('User already exists with this email'); 

    const newUser = await User.create(payload);
    if (!newUser) throw new Error('Failed to create user'); 


    const contractorData = {
      userId: newUser._id
    }

    const contractor = await Contractor.create(contractorData);
    if (!contractor) throw new Error('Failed to create user'); 


  // Populate user field in contractor document
  const populatedContractor = await Contractor.findById(contractor._id).populate({
    path: 'userId',
    // select: '-password -__v', // exclude sensitive fields
  });


  // console.log(newUser, 'newUser service');
  // console.log(contractor, 'contractor service');
  
  //  payload.role = payload.role || 'client'

  // Handle file upload if present
  // if (file) {
  //   payload.profileImg = file?.location;
  // }


  //create token and sent to the  client
  const jwtPayload:any = {
    userEmail: newUser.email,
    role: newUser.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    contractor: populatedContractor,
  };
};
const getMe = async (userEmail: string) => {
  // const result = await User.findOne({ email: userEmail });
  const result = await User.findOne({ email: userEmail }).populate('preference').select('-password');

  return result;
};
const getSingleUserIntoDB = async (id: string) => {
  const result = await User.findOne({ _id: id, isDeleted: false }).populate('preference').select('-password');
  return result;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find(), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result,
  };
};
const getAllApprovalFalseUsersFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find({approvalStatus: false, isDeleted: false}), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const changeStatus = async (id: string, payload: { status: string }) => {
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
  });
    

  return result;
};
const updateUserIntoDB = async (id: string, payload?: Partial<TUser>, file?: any) => {


 let modifiedUpdatedData: Record<string, unknown> = {};
 
 if(payload) {
  const {  ...userData } = payload;
    modifiedUpdatedData = { ...userData };
 } 
  // const { fullName, ...userData } = payload;
  // if (name && Object.keys(name).length) {
  //   for (const [key, value] of Object.entries(name)) {
  //     modifiedUpdatedData[`name.${key}`] = value;
  //   }
  // }

  // Handle file upload if present
  if (file) {
    modifiedUpdatedData.profileImg = file.location as string;
  }

  const result = await User.findByIdAndUpdate(
    id,
    modifiedUpdatedData,
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  return result;
};
const updateApprovalIntoDB = async (id: string, payload?: Partial<TUser>, file?: any) => {
 let modifiedUpdatedData: Record<string, unknown> = {};

 if(payload) {
  const {  ...userData } = payload;
    modifiedUpdatedData = { ...userData };
 } 
  // const { fullName, ...userData } = payload;
  // if (name && Object.keys(name).length) {
  //   for (const [key, value] of Object.entries(name)) {
  //     modifiedUpdatedData[`name.${key}`] = value;
  //   }
  // }

  // Handle file upload if present
  if (file) {
    modifiedUpdatedData.profileImg = file.location as string;
  }

  const result = await User.findByIdAndUpdate(
    id,
    modifiedUpdatedData,
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  return result;
};
const deleteUserFromDB = async (id: string) => {
  // const session = await mongoose.startSession(); // Start a session
  // session.startTransaction(); // Start transaction

  try {
    // Step 1: Soft-delete the user
    const deletedUser = await User.findByIdAndDelete(
      id,
      { new: true } // Pass the session
      // { new: true, session } // Pass the session
    );

    if (!deletedUser) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
    }

    // Step 2: Soft-delete the associated quote
    // const deleted = await User.findOneAndUpdate(
    //   { userId: id }, // Find the single quote associated with the user
    //   { isDeleted: true }, // Set isDeleted to true
    //   { new: true, session } // Pass the session
    // );

    // // Optional: Validate that a quote was found and updated
    // if (!deleted) {
    //   console.warn(`No quote found for user with ID ${id}`);
    // }

    // Commit the transaction if all operations succeed
    // await session.commitTransaction();
    // session.endSession();

    return deletedUser;
  } catch (error) {
    // Rollback the transaction if any operation fails
    // await session.abortTransaction();
    // session.endSession();
    // throw error; // Propagate the error to be handled by the caller

    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
  }
};
const getUsersMonthlyFromDB = async () => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1); // January 1st, current year
  const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1); // January 1st, next year

  const result = await User.aggregate([
    {
      $match: {
        // status: 'active',
        // isDeleted: false,
        createdAt: { $gte: startOfYear, $lt: endOfYear } // Filter users created in the current year
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" }, // Group by month of 'createdAt'
        count: { $sum: 1 } // Count users per month
      }
    },
    {
      $sort: { _id: 1 } // Sort by month in ascending order
    }
  ]);

  // Format result to include month names (optional)
  const formattedResult = result.map(item => ({
    month: new Date(0, item._id - 1).toLocaleString('default', { month: 'long' }),
    count: item.count
  }));

  return formattedResult;
};
const getAllProvidersFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find({role: 'provider'}), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result,
  };
};
const getAllClientsFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find({role: 'admin'}), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result,
  };
};

// const getAllPreferedProvidersFromDB = async (query: Record<string, unknown>) => {
//   const rawDays = query.days;
//   const rawStartTime = query.startTime;
//   const rawDuration = query.duration;

//   // Parse days (support string "Mon,Tue" or array ["Mon", "Tue"])
//   let days: string[] = [];
//   if (typeof rawDays === 'string') {
//     days = rawDays.split(',').map(d => d.trim());
//   } else if (Array.isArray(rawDays)) {
//     days = rawDays.filter(d => typeof d === 'string') as string[];
//   }

//   const startTime = typeof rawStartTime === 'string' ? rawStartTime : '';
//   const duration = typeof rawDuration === 'string' ? Number(rawDuration) :
//                    typeof rawDuration === 'number' ? rawDuration : NaN;

//   if (days.length === 0 || !startTime || isNaN(duration) || duration <= 0) {
//     throw new Error('Invalid search parameters: days, startTime, and duration are required.');
//   }

//   // Calculate endTime string "HH:mm"
//   const calculateEndTime = (start: string, dur: number): string => {
//     const [hourStr, minuteStr] = start.split(':');
//     let hour = parseInt(hourStr, 10);
//     const minute = parseInt(minuteStr, 10);

//     hour += dur;
//     if (hour >= 24) hour -= 24;

//     return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
//   };

//   const endTime = calculateEndTime(startTime, duration);

//   // Build the query
//   const filter = {
//     role: 'provider',
//     // approvalStatus: true,
//     isDeleted: false,
//     mySchedule: {
//       $elemMatch: {
//         day: { $in: days },
//         startTime: { $lte: startTime },
//         endTime: { $gte: endTime }
//       }
//     }
//   };

//   // Run query (add pagination or sorting if you want)
//   const providers = await User.find(filter)
//     .select('-password -__v') // exclude sensitive fields
//     .limit(10);

//   // Return as you want
//   return {
//     meta: {
//       total: providers.length,
//       limit: 10,
//       page: 1,
//       totalPage: 1
//     },
//     result: providers,
//   };
// };


const getAllPreferedProvidersFromDB = async (query: Record<string, unknown>) => {
  const rawDays = query.days;
  const rawStartTime = query.startTime;
  const rawDuration = query.duration;

  // Parse days (support string "Mon,Tue" or array ["Mon", "Tue"])
  let days: string[] = [];
  if (typeof rawDays === 'string') {
    days = rawDays.split(',').map(d => d.trim());
  } else if (Array.isArray(rawDays)) {
    days = rawDays.filter(d => typeof d === 'string') as string[];
  }

  const startTime = typeof rawStartTime === 'string' ? rawStartTime : '';
  const duration = typeof rawDuration === 'string' ? Number(rawDuration) :
                   typeof rawDuration === 'number' ? rawDuration : NaN;

  // Base filter always includes role and isDeleted
  const filter: any = {
    role: 'provider',
    isDeleted: false,
  };

  // If at least one of days, startTime, or duration is provided, add mySchedule filter
  if (days.length > 0 || startTime || (!isNaN(duration) && duration > 0)) {
    // Prepare schedule filter object
    const scheduleFilter: any = {};

    if (days.length > 0) {
      scheduleFilter.day = { $in: days };
    }

    // If startTime provided, add startTime condition
    if (startTime) {
      scheduleFilter.startTime = { $lte: startTime };
    }

    // If duration provided, calculate endTime and add endTime condition
    if (!isNaN(duration) && duration > 0 && startTime) {
      const calculateEndTime = (start: string, dur: number): string => {
        const [hourStr, minuteStr] = start.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        hour += dur;
        if (hour >= 24) hour -= 24;

        return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
      };
      const endTime = calculateEndTime(startTime, duration);
      scheduleFilter.endTime = { $gte: endTime };
    }

    filter.mySchedule = { $elemMatch: scheduleFilter };
  }

  // Query DB with constructed filter
  const providers = await User.find(filter)
    .select('-password -__v')
    .limit(10);

  return {
    meta: {
      total: providers.length,
      limit: 10,
      page: 1,
      totalPage: 1
    },
    result: providers,
  };
};



export const UserServices = {
  createContractorIntoDB,
  createCustomerIntoDB,
  getSingleUserIntoDB,
  getUsersMonthlyFromDB, 
  deleteUserFromDB,
  getMe,
  changeStatus,
  getAllUsersFromDB,
  updateUserIntoDB, 
  getAllProvidersFromDB, 
  // updateApprovalIntoDB,
  // getAllApprovalFalseUsersFromDB,
  getAllClientsFromDB,
  // addMobileNumberIntoDB,
  // getAllPreferedProvidersFromDB
};
