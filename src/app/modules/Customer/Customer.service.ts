/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CUSTOMER_SEARCHABLE_FIELDS } from './Customer.constant';
import mongoose from 'mongoose';
import { Customer } from './Customer.model';
import { TCustomer } from './Customer.interface';
import { User } from '../User/user.model';

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

const changeLocation = async (customerId: any, payload: any) => {

  const { name, isSelect } = payload;

  if (!isSelect || !name) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid payload for changing location');
  }

  const customer = await Customer.findById(customerId) as any;
  if (!customer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  customer.location.forEach((loc: any) => {
    loc.isSelect = false;
  });

  const targetLocation = customer.location.find((loc: any) => loc.name === name);
  if (!targetLocation) {
    throw new AppError(httpStatus.NOT_FOUND, `Location '${name}' not found`);
  }
  targetLocation.isSelect = true;

  const updatedCustomer = await customer.save();

  return updatedCustomer;
};

export const CustomerServices = {
  changeLocation,
  createCustomerIntoDB,
  getAllCustomersFromDB,
  getSingleCustomerFromDB,
  updateCustomerIntoDB,
  deleteCustomerFromDB
};
