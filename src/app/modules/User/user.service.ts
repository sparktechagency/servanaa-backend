/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from 'mongoose';


import httpStatus from 'http-status';
import { TUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { contractorFields, customerFields, userFields, usersSearchableFields } from './user.constant';
import AppError from '../../errors/AppError';

import config from '../../config';
import { OtpServices } from '../Otp/otp.service';
import { createToken } from '../Auth/auth.utils';
import { Contractor } from '../Contractor/Contractor.model';
import { Customer } from '../Customer/Customer.model';
import mongoose from 'mongoose';


// export const addMobileNumberIntoDB = async (phoneNumber: any, user: any) => {

//      if (!phoneNumber) {
//         return 'Phone number is required.'
//       }

//     const result = await OtpServices.generateAndSendOTPToMobile(phoneNumber?.phone, user?.userEmail);

//     return result;
// };

export const createCustomerIntoDB = async (payload: any) => {


     const userData = await User.isUserExistsByCustomEmail(payload.email);
    if (userData) throw new Error('Customer already exists with this email'); 

    const newUser = await User.create(payload);
    if (!newUser) throw new Error('Failed to create user'); 


    const customerData = {
      userId: newUser._id
    }

    const customer = await Customer.create(customerData);
    if (!customer) throw new Error('Failed to create user'); 


  // Populate user field in contractor document
  const populatedCustomer = await Contractor.findById(customer._id).populate({
    path: 'userId',
    // select: '-password -__v', // exclude sensitive fields
  });

    if(newUser){
      await OtpServices.generateAndSendOTP(newUser.email);
    }


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
    customer:populatedCustomer
  };
};
export const createContractorIntoDB = async (payload: any) => {
   

    const userData = await User.isUserExistsByCustomEmail(payload.email);
    if (userData) throw new Error('Contractor already exists with this email'); 

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

    if(newUser){
      await OtpServices.generateAndSendOTP(newUser.email);
    }


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
  const result = await User.findOne({ email: userEmail }).select('-password');

  return result;
};
const getSingleUserIntoDB = async (id: string) => {
  const result = await User.findOne({ _id: id, isDeleted: false }).select('-password');
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

const changeStatus = async (id: string, payload: { status: string }) => {
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true,
  });
    

  return result;
};



// Helper function to pick only the fields you want to update
function extractFields(payload: Record<string, any>, allowedFields: string[]) {
  const extracted: Record<string, any> = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      extracted[key] = payload[key];
    }
  }
  return extracted;
}
const updateUserIntoDB = async (id: string, payload?: Partial<TUser>, file?: any, user?: any) => {
  // 1. Extract common user fields for User collection update
  const userDataToUpdate = extractFields(payload || {}, userFields);
  
  // 2. If file uploaded (image), add img field for user
  if (file && file.location) {
    userDataToUpdate.img = file.location;
  }


  // 3. Update User collection document and get updated user data
  const updatedUser = await User.findByIdAndUpdate(
    id,
    userDataToUpdate,
    { new: true, runValidators: true }
  ).select('-password'); // exclude password in result

  if (!updatedUser) {
    throw new Error('User not found');
  }


  // 4. Extract role-specific fields depending on user's role
  let roleDataToUpdate = null;
  let updatedRoleData = null;

  if (user?.role === 'customer') {
    roleDataToUpdate = extractFields(payload || {}, customerFields);
    updatedRoleData = await Customer.findOneAndUpdate(
      { userId: id },
      roleDataToUpdate,
      { new: true, runValidators: true }
    );
  } else if (user?.role === 'contractor') {
    roleDataToUpdate = extractFields(payload || {}, contractorFields);
    updatedRoleData = await Contractor.findOneAndUpdate(
      { userId: id },
      roleDataToUpdate,
      { new: true, runValidators: true }
    );
  }

  // 5. Return combined updated data for frontend or caller
  return {
    user: updatedUser,
    roleData: updatedRoleData,
  };

};
const deleteUserFromDB = async (userId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Delete user document
    const deletedUser = await User.findByIdAndDelete(userId, { session });
    if (!deletedUser) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
    }

    // 2. Delete role-specific document
    if (deletedUser.role === 'customer') {
      await Customer.findOneAndDelete({ userId }, { session });
    } else if (deletedUser.role === 'contractor') {
      await Contractor.findOneAndDelete({ userId }, { session });
    }

    // 3. Commit transaction
    await session.commitTransaction();
    session.endSession();

    return deletedUser;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


// const deleteUserFromDB = async (id: string) => {

//   try {
//     // Step 1: Soft-delete the user
//     const deletedUser = await User.findByIdAndDelete(
//       id,
//       { new: true } 
//     );

//     if (!deletedUser) {
//       throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
//     }



//     // // Optional: Validate that a quote was found and updated
//     // if (!deleted) {
//     //   console.warn(`No quote found for user with ID ${id}`);
//     // }

//     // Commit the transaction if all operations succeed
//     // await session.commitTransaction();
//     // session.endSession();

//     return deletedUser;
//   } catch (error) {
//     // Rollback the transaction if any operation fails
//     // await session.abortTransaction();
//     // session.endSession();
//     // throw error; // Propagate the error to be handled by the caller

//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
//   }
// };
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
  getAllClientsFromDB,
};
