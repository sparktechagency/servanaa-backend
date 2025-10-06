/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CUSTOMER_SEARCHABLE_FIELDS } from './Customer.constant';
import mongoose from 'mongoose';
// import { TCustomer } from './Customer.interface';
import { Customer } from './Customer.model';
// import { TCustomer } from './Customer.interface';
import { Notification } from '../Notification/Notification.model';
import { User } from '../User/user.model';
import config from '../../config';
import { createToken } from '../Auth/auth.utils';
import { OtpServices } from '../Otp/otp.service';

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

    const customer = await Customer.create(payload);
    if (!customer) throw new Error('Failed to create contractor');

    payload.customer = customer._id;

    // const customerResult = await Customer.create([payload], { session });
    // const customer = customerResult[0];
    // if (!customer) throw new Error('Failed to create user');

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
const getAllCustomersFromDB = async (query: Record<string, unknown>) => {
  const CustomerQuery = new QueryBuilder(Customer.find(), query)
    .search(CUSTOMER_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await CustomerQuery.modelQuery;
  const meta = await CustomerQuery.countTotal();
  return {
    result,
    meta
  };
};

const getSingleCustomerFromDB = async (id: string) => {
  const result = await Customer.findById(id);

  return result;
};

const updateCustomerIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('customers')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } }
    );

  if (!isDeletedService?.name) {
    throw new Error('Customer not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Customer');
  }

  const updatedData = await Customer.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true
  });

  if (!updatedData) {
    throw new Error('Customer not found after update');
  }

  return updatedData;
};

const deleteCustomerFromDB = async (id: string) => {
  const deletedService = await Customer.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Customer');
  }

  return deletedService;
};
const getCustomerNotificationsFromDB = async (userEmail: string) => {
  const user = await User.findOne({ email: userEmail }).populate('customer');

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user?.customer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const notifications = await Notification.find({
    userId: user.customer._id,
    isDeleted: false
  }).sort({ createdAt: -1 });

  return notifications;
};

export const CustomerServices = {
  createCustomerIntoDB,
  getAllCustomersFromDB,
  getSingleCustomerFromDB,
  updateCustomerIntoDB,
  deleteCustomerFromDB,
  getCustomerNotificationsFromDB
};
