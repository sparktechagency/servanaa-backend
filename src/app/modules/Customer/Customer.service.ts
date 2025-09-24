/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CUSTOMER_SEARCHABLE_FIELDS } from './Customer.constant';
import mongoose from 'mongoose';
// import { TCustomer } from './Customer.interface';
import { Customer } from './Customer.model';
import { TCustomer } from './Customer.interface';

const createCustomerIntoDB = async (payload: TCustomer) => {
  const result = await Customer.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Customer');
  }

  return result;
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

export const CustomerServices = {
  createCustomerIntoDB,
  getAllCustomersFromDB,
  getSingleCustomerFromDB,
  updateCustomerIntoDB,
  deleteCustomerFromDB
};
