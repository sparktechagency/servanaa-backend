/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { SUBCATEGORY_SEARCHABLE_FIELDS } from './SubCategory.constant';
import mongoose from 'mongoose';
import { TSubCategory } from './SubCategory.interface';
import { SubCategory } from './SubCategory.model';

const createSubCategoryIntoDB = async (
  payload: TSubCategory,
  file:any
) => {

  if(file) {
    payload.img = file.location;
    console.log(file.location, 'file.location');
    console.log(payload.img, 'payload.img');
    // https://servana-bucket.s3.ap-southeast-2.amazonaws.com/1748498627351_download.jpg
    // https://servana-bucket.s3.ap-southeast-2.amazonaws.com/1748498627351_download.jpg
  }

  const result = await SubCategory.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create SubCategory');
  }

  return result;
};

const getAllSubCategorysFromDB = async (query: Record<string, unknown>) => {
  const SubCategoryQuery = new QueryBuilder(
    SubCategory.find(),
    query,
  )
    .search(SUBCATEGORY_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await SubCategoryQuery.modelQuery;
  const meta = await SubCategoryQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleSubCategoryFromDB = async (id: string) => {
  const result = await SubCategory.findById(id);

  return result;
};

const updateSubCategoryIntoDB = async (id: string, payload: any, file?: any) => {

  if(file) {
    payload.img = file.location;
  }

  const isDeletedService = await mongoose.connection
    .collection('subcategories')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('SubCategory not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted SubCategory');
  }

  const updatedData = await SubCategory.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('SubCategory not found after update');
  }

  return updatedData;
};

const deleteSubCategoryFromDB = async (id: string) => {
  const deletedService = await SubCategory.findByIdAndDelete(
    id,
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete SubCategory');
  }

  return deletedService;
};

export const SubCategoryServices = {
  createSubCategoryIntoDB,
  getAllSubCategorysFromDB,
  getSingleSubCategoryFromDB,
  updateSubCategoryIntoDB,
  deleteSubCategoryFromDB,
};
