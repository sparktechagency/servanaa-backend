/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { TransactionHistorySearchableFields } from './TransactionHistory.constant';
import mongoose from 'mongoose';
import { TTransactionHistory } from './TransactionHistory.interface';
import { TransactionHistory } from './TransactionHistory.model';

const createTransactionHistoryIntoDB = async (
  payload: TTransactionHistory,
) => {
  const result = await TransactionHistory.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create TransactionHistory');
  }

  return result;
};

const getAllTransactionHistorysFromDB = async (query: Record<string, unknown>) => {
  const TransactionHistoryQuery = new QueryBuilder(
    TransactionHistory.find(),
    query,
  )
    .search(TransactionHistorySearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await TransactionHistoryQuery.modelQuery;
  const meta = await TransactionHistoryQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleTransactionHistoryFromDB = async (id: string) => {
  const result = await TransactionHistory.findById(id);

  return result;
};

const updateTransactionHistoryIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('transactionhistorys')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('TransactionHistory not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted TransactionHistory');
  }

  const updatedData = await TransactionHistory.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('TransactionHistory not found after update');
  }

  return updatedData;
};

const deleteTransactionHistoryFromDB = async (id: string) => {
  const deletedService = await TransactionHistory.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete TransactionHistory');
  }

  return deletedService;
};

export const TransactionHistoryServices = {
  createTransactionHistoryIntoDB,
  getAllTransactionHistorysFromDB,
  getSingleTransactionHistoryFromDB,
  updateTransactionHistoryIntoDB,
  deleteTransactionHistoryFromDB,
};
