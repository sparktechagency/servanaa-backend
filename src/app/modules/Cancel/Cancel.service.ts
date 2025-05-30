/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CANCEL_SEARCHABLE_FIELDS } from './Cancel.constant';
import mongoose from 'mongoose';
import { TCancel } from './Cancel.interface';
import { Cancel } from './Cancel.model';

const createCancelIntoDB = async (
  payload: TCancel,
) => {
  const result = await Cancel.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Cancel');
  }

  return result;
};

const getAllCancelsFromDB = async (query: Record<string, unknown>) => {
  const CancelQuery = new QueryBuilder(
    Cancel.find(),
    query,
  )
    .search(CANCEL_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await CancelQuery.modelQuery;
  const meta = await CancelQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleCancelFromDB = async (id: string) => {
  const result = await Cancel.findById(id);

  return result;
};

const updateCancelIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('cancels')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      // { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService) {
    throw new Error('Cancel not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Cancel');
  }

  const updatedData = await Cancel.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Cancel not found after update');
  }

  return updatedData;
};

const deleteCancelFromDB = async (id: string) => {
  const deletedService = await Cancel.findByIdAndDelete(
    id,
    { isDeleted: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Cancel');
  }

  return deletedService;
};

export const CancelServices = {
  createCancelIntoDB,
  getAllCancelsFromDB,
  getSingleCancelFromDB,
  updateCancelIntoDB,
  deleteCancelFromDB,
};
