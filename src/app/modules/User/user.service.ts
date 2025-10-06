/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import mongoose from 'mongoose';

import httpStatus from 'http-status';
import { TUser } from './user.interface';
import { User } from './user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import {
  contractorFields,
  customerFields,
  userFields,
  usersSearchableFields
} from './user.constant';
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

// create customer
export const createCustomerIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();

  try {
    const existingUser = await User.isUserExistsByCustomEmail(payload.email);

    if (existingUser) {
      await OtpServices.generateAndSendOTP(payload.email);
      throw new Error(
        'User already exists. OTP has been resent to your email for verification.'
      );
    }

    session.startTransaction();
    const customerResult = await Customer.create([payload], { session });
    const customer = customerResult[0];
    if (!customer) throw new Error('Failed to create user');

    payload.customer = customer._id;

    const userResult = await User.create([payload], { session });
    const newUser = userResult[0];
    if (!newUser) throw new Error('Failed to create user');
    customer.userId = newUser._id;
    await customer.save({ session });
    // Commit transaction
    await session.commitTransaction();

    // Populate user field in contractor document
    const userCustomer = await User.findById(newUser._id).populate({
      path: 'customer'
      // select: '-password -__v', // exclude sensitive fields
    });

    if (newUser) {
      await OtpServices.generateAndSendOTP(newUser.email);
    }

    //create token and sent to the  client
    const jwtPayload: any = {
      userEmail: newUser.email,
      role: newUser.role
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
      refreshToken,
      userCustomer
    };
  } catch (error) {
    // Rollback transaction on any error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    // End session
    await session.endSession();
  }
};

// create contractor
export const createContractorIntoDB = async (payload: any) => {
  const session = await mongoose.startSession();

  try {
    const existingUser = await User.isUserExistsByCustomEmail(payload.email);

    if (existingUser) {
      await OtpServices.generateAndSendOTP(payload.email);
      throw new Error(
        'User already exists. OTP has been resent to your email for verification.'
      );
    }

    const contractor = await Contractor.create(payload);
    if (!contractor) throw new Error('Failed to create contractor');

    payload.contractor = contractor._id;

    const newUser = await User.create(payload);
    if (!newUser) throw new Error('Failed to create user');

    contractor.userId = newUser._id;
    contractor.save();

    // Populate user field in contractor document
    const populatedContractor = await User.findById(newUser?._id).populate({
      path: 'contractor'
      // select: '-password -__v', // exclude sensitive fields
    });

    if (newUser) {
      await OtpServices.generateAndSendOTP(newUser.email);
    }

    //create token and sent to the  client
    const jwtPayload: any = {
      userEmail: newUser.email,
      role: newUser.role
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
      refreshToken,
      populatedContractor
    };
  } catch (error) {
    // Rollback transaction on any error
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    // End session
    await session.endSession();
  }
};

const getMe = async (userEmail: string) => {
  // const result = await User.findOne({ email: userEmail });
  const user = await User.findOne({ email: userEmail }).select('-password');

  if (user?.status === 'blocked') {
    throw new Error('User is Blocked');
  } else {
    if (user?.role === 'contractor') {
      await user.populate({
        path: 'contractor',
        populate: {
          path: 'myScheduleId'
        }
      }); // Populating contractor data
    } else if (user?.role === 'customer') {
      await user.populate('customer'); // Populating customer data
    }
    return user;
  }
};

// get single user into db
const getSingleUserIntoDB = async (id: string) => {
  // Fetch the user from the database first
  const user = await User.findById(id);
  // Check the role and populate the respective field
  if (!user) {
    throw new Error('User not found');
  }

  // Populate the correct field based on user role
  if (user.role === 'contractor') {
    await user.populate('contractor'); // Populating contractor data
  } else if (user.role === 'customer') {
    await user.populate('customer'); // Populating customer data
  }

  return user;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(
    User.find({ role: { $ne: 'superAdmin' } })
      .populate('contractor', 'location') // Populating location from contractor
      .populate('customer', 'location'), // Populating location from customer
    query
  )
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result
  };
};

const changeStatus = async (id: string, payload: { status: string }) => {
  const result = await User.findByIdAndUpdate(id, payload, {
    new: true
  });

  return result;
};

// Helper function to pick only the fields you want to update
function extractFields (payload: Record<string, any>, allowedFields: string[]) {
  const extracted: Record<string, any> = {};
  for (const key of allowedFields) {
    if (payload[key] !== undefined) {
      extracted[key] = payload[key];
    }
  }

  return extracted;
}

function mergeArrayField<T = any> (existing: T[] = [], incoming: T[] = []): T[] {
  return [...new Set([...existing, ...incoming])];
}

function removeArrayItems<T> (
  existing: T[] = [],
  toRemove: T[] = [],
  key?: keyof T
): T[] {
  if (key) {
    return existing.filter(
      existingItem =>
        !toRemove.some(removeItem => existingItem[key] === removeItem[key])
    );
  } else {
    return existing.filter(item => !toRemove.includes(item));
  }
}

const updateUserIntoDB = async (
  id: string,
  payload?: any,
  file?: any,
  user?: any
) => {
  if (payload?.subscriptionStatus) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Subscription status cannot be updated directly. Please use subscription management endpoints.'
    );
  }

  const userDataToUpdate = extractFields(payload || {}, userFields);

  if (file && file.location) {
    userDataToUpdate.img = file.location;
  }

  const updatedUser = await User.findByIdAndUpdate(id, userDataToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!updatedUser) throw new Error('User not found');

  let roleDataToUpdate: any = {};
  let updatedRoleData: any = {};

  const add = payload?.add || {};
  const remove = payload?.remove || {};

  if (user?.role === 'contractor') {
    roleDataToUpdate = extractFields(payload || {}, contractorFields);
    if (payload.dob) roleDataToUpdate.dob = payload.dob;
    if (payload.gender) roleDataToUpdate.gender = payload.gender;
    if (payload.experience) roleDataToUpdate.experience = payload.experience;
    if (payload.bio) roleDataToUpdate.bio = payload.bio;
    if (payload.city) roleDataToUpdate.city = payload.city;
    if (payload.language) roleDataToUpdate.language = payload.language;
    if (payload.location) roleDataToUpdate.location = payload.location;
    if (payload.rateHourly) roleDataToUpdate.rateHourly = payload.rateHourly;
    if (payload.skillsCategory)
      roleDataToUpdate.skillsCategory = payload.skillsCategory;
    if (payload.ratings) roleDataToUpdate.ratings = payload.ratings;
    if (payload.category) roleDataToUpdate.category = payload.category;
    if (payload.subCategory) roleDataToUpdate.subCategory = payload.subCategory;

    const existingContractor = await Contractor.findOne({
      _id: updatedUser.contractor
    });
    if (!existingContractor) throw new Error('Contractor not found');

    // Skills
    const existingSkills = Array.isArray(existingContractor.skills)
      ? existingContractor.skills
      : [];
    const addedSkills = add.skills || [];
    const removedSkills = remove.skills || [];
    const afterAddSkills = mergeArrayField(existingSkills, addedSkills);
    const finalSkills = removeArrayItems(afterAddSkills, removedSkills);

    if (addedSkills.length || removedSkills.length) {
      roleDataToUpdate.skills = finalSkills;
      //  console.log('roleDataToUpdate', roleDataToUpdate)
    }

    // Certificates
    const existingCertificates = existingContractor.certificates || [];
    const addedCerts = add.certificates || [];
    const removedCerts = remove.certificates || [];

    const afterAddCerts = mergeArrayField(existingCertificates, addedCerts);
    const finalCerts = removeArrayItems(afterAddCerts, removedCerts);

    if (addedCerts.length || removedCerts.length) {
      roleDataToUpdate.certificates = finalCerts;
    }

    // mySchedule
    // const existingSchedule = existingContractor?.myScheduleId || [];
    const existingSchedule = Array.isArray(existingContractor?.myScheduleId)
      ? existingContractor.myScheduleId
      : [existingContractor.myScheduleId];
    const addedSchedule = add.mySchedule || [];
    const removedSchedule = remove.mySchedule || [];

    const afterAddSchedule = [...existingSchedule, ...addedSchedule];
    const finalSchedule = removeArrayItems(
      afterAddSchedule,
      removedSchedule,
      'day'
    ); // assuming 'day' is unique

    if (addedSchedule.length || removedSchedule.length) {
      roleDataToUpdate.mySchedule = finalSchedule;
    }

    // Materials (add/remove)
    const existingMaterials = existingContractor.materials || [];
    const addedMaterials = add.materials || [];
    const removedMaterials = remove.materials || [];

    // const afterAddMaterials = mergeArrayField(existingMaterials, addedMaterials);
    const afterAddMaterials = [...existingMaterials, ...addedMaterials];
    // const finalMaterials = removeArrayItems(afterAddMaterials, removedMaterials);
    const finalMaterials = removeArrayItems(
      afterAddMaterials,
      removedMaterials,
      'name'
    );

    if (addedMaterials.length || removedMaterials.length) {
      roleDataToUpdate.materials = finalMaterials;
    }

    updatedRoleData = await Contractor.findOneAndUpdate(
      { _id: updatedUser.contractor },
      roleDataToUpdate,
      { new: true, runValidators: true }
    );
  }

  if (user?.role === 'customer') {
    roleDataToUpdate = extractFields(payload || {}, customerFields);
    updatedRoleData = await Customer.findOneAndUpdate(
      { _id: updatedUser.customer },
      roleDataToUpdate,
      { new: true, runValidators: true }
    );
  }

  return {
    user: updatedUser,
    roleData: updatedRoleData
  };
};

const deleteUserFromDB = async (userId: string) => {
  const session = await mongoose.startSession();
  // try {
  // session.startTransaction();
  // 1. Delete user document
  const deletedUser = await User.findByIdAndDelete(userId);
  // const deletedUser = await User.findByIdAndDelete(userId, { session });
  if (!deletedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete User');
  }

  // 2. Delete role-specific document
  if (deletedUser.role === 'customer') {
    await Customer.findOneAndDelete({ userId });
    // await Customer.findOneAndDelete({ userId }, { session });
  } else if (deletedUser.role === 'contractor') {
    await Contractor.findOneAndDelete({ userId });
    // await Contractor.findOneAndDelete({ userId }, { session });
  }

  // 3. Commit transaction
  // await session.commitTransaction();
  // session.endSession();

  return deletedUser;
  // } catch (error) {
  //   // Abort transaction on error
  //   await session.abortTransaction();
  //   session.endSession();
  //   throw error;
  // }
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
        _id: { $month: '$createdAt' }, // Group by month of 'createdAt'
        count: { $sum: 1 } // Count users per month
      }
    },
    {
      $sort: { _id: 1 } // Sort by month in ascending order
    }
  ]);

  // Format result to include month names (optional)
  const formattedResult = result.map(item => ({
    month: new Date(0, item._id - 1).toLocaleString('default', {
      month: 'long'
    }),
    count: item.count
  }));

  return formattedResult;
};
const getAllProvidersFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find({ role: 'provider' }), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result
  };
};
const getAllClientsFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(User.find({ role: 'admin' }), query)
    .search(usersSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await studentQuery.countTotal();
  const result = await studentQuery.modelQuery;

  return {
    meta,
    result
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
  getAllClientsFromDB
};
