/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from 'http-status';

import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { Upload } from './Upload.model';
import { UPLOAD_SEARCHABLE_FIELDS } from './Upload.constant';
import AppError from '../../errors/AppError';

const createUploadIntoDB = async (
  file: any,
) => {
  // const fileUrl = `/uploads/${file.filename}`;  
  // const result = fileUrl;  
 const result = file.location;

  return result;
};

const getAllUploadsFromDB = async (query: Record<string, unknown>) => {
  const UploadQuery = new QueryBuilder(
    Upload.find(),
    query,
  )
    .search(UPLOAD_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await UploadQuery.modelQuery;
  const meta = await UploadQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleUploadFromDB = async (id: string) => {
  const result = await Upload.findById(id);

  return result;
};

const updateUploadIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('uploads')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('Upload not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Upload');
  }

  const updatedData = await Upload.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Upload not found after update');
  }

  return updatedData;
};

const deleteUploadFromDB = async (id: string) => {
  const deletedService = await Upload.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Upload');
  }

  return deletedService;
};

export const UploadServices = {
  createUploadIntoDB,
  getAllUploadsFromDB,
  getSingleUploadFromDB,
  updateUploadIntoDB,
  deleteUploadFromDB,
};
