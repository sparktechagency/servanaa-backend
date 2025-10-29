/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { HELP_SEARCHABLE_FIELDS } from './Help.constant';
import mongoose from 'mongoose';
import { THelp } from './Help.interface';
import { Help } from './Help.model';
import { User } from '../User/user.model';

const createHelpIntoDB = async (
  payload: THelp,
  user: any
) => {

  const usr = await User.findOne({ email: user.userEmail }).select(' fullName img _id role');
  console.log('usr', usr)

  if (!usr) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  payload.userId = usr?._id;
  const result = await Help.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Help');
  }

  usr.messageId = result._id;
  // const us = await usr.save();


  const updatedUser = await User.findByIdAndUpdate(
    { _id: usr?._id },
    usr,
    { new: true, runValidators: true },
  );


  if (!updatedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update user with help message');
  }

  return result;
};

const getAllHelpsFromDB = async (query: Record<string, unknown>) => {
  const HelpQuery = new QueryBuilder(
    Help.find().populate('userId', 'fullName email img role'),
    query,
  )
    .search(HELP_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await HelpQuery.modelQuery;
  const meta = await HelpQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleHelpFromDB = async (id: string) => {
  const result = await Help.findById(id);

  return result;
};

const updateHelpIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('helps')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Help not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Help');
  }

  const updatedData = await Help.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Help not found after update');
  }

  return updatedData;
};

const deleteHelpFromDB = async (id: string) => {
  const deletedService = await Help.findByIdAndDelete(
    id,
    { isDeleted: true },
    // { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Help');
  }

  return deletedService;
};

export const HelpServices = {
  createHelpIntoDB,
  getAllHelpsFromDB,
  getSingleHelpFromDB,
  updateHelpIntoDB,
  deleteHelpFromDB,
};
