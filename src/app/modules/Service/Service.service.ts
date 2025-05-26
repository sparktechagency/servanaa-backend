/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { SERVICE_SEARCHABLE_FIELDS } from './Service.constant';
import mongoose from 'mongoose';
import { TService } from './Service.interface';
import { Service } from './Service.model';

const createServiceIntoDB = async (
  payload: TService,
  // file: any
) => {

  // if(file) {
  //   payload.img = file.location;
  // }
  

  const result = await Service.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Service');
  }

  return result;
};

const getAllServicesFromDB = async (query: Record<string, unknown>) => {
  const ServiceQuery = new QueryBuilder(
    Service.find(),
    query,
  )
    .search(SERVICE_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ServiceQuery.modelQuery;
  const meta = await ServiceQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleServiceFromDB = async (id: string) => {
  const result = await Service.findById(id);

  return result;
};

const updateServiceIntoDB = async (id: string, payload: any) => {


  const isDeletedService = await mongoose.connection
    .collection('services')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Service not found');
  }

  const updatedData = await Service.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Service not found after update');
  }

  return updatedData;
};

const deleteServiceFromDB = async (id: string) => {
  const deletedService = await Service.findByIdAndDelete(
    id,
    // { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Service');
  }

  return deletedService;
};

export const ServiceServices = {
  createServiceIntoDB,
  getAllServicesFromDB,
  getSingleServiceFromDB,
  updateServiceIntoDB,
  deleteServiceFromDB,
};
