/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CATEGORY_SEARCHABLE_FIELDS } from './Category.constant';
import mongoose from 'mongoose';
import { TCategory } from './Category.interface';
import { Category } from './Category.model';

const createCategoryIntoDB = async (
  payload: TCategory,
  file: any
) => {

  if(file) {
    payload.img = file.location;
  }
  

  const result = await Category.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Category');
  }

  return result;
};

const getAllCategorysFromDB = async (query: Record<string, unknown>) => {
  const CategoryQuery = new QueryBuilder(
    Category.find(),
    query,
  )
    .search(CATEGORY_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await CategoryQuery.modelQuery;
  const meta = await CategoryQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findById(id);

  return result;
};

const updateCategoryIntoDB = async (id: string, payload: any, file?: any) => {

  if(file) {
    payload.img = file.location;
  }


  const isDeletedService = await mongoose.connection
    .collection('categories')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Category not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Category');
  }

  const updatedData = await Category.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Category not found after update');
  }

  return updatedData;
};

const deleteCategoryFromDB = async (id: string) => {
  const deletedService = await Category.findByIdAndDelete(
    id,
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Category');
  }

  return deletedService;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategorysFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
