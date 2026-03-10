/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { SUBCATEGORY_SEARCHABLE_FIELDS } from './SubCategory.constant';
import mongoose from 'mongoose';
import { TSubCategory } from './SubCategory.interface';
import { SubCategory } from './SubCategory.model';

const createSubCategoryIntoDB = async (payload: TSubCategory, file: any) => {
  if (file) {
    payload.img = file.location;
    // https://servana-bucket.s3.ap-southeast-2.amazonaws.com/1748498627351_download.jpg
    // https://servana-bucket.s3.ap-southeast-2.amazonaws.com/1748498627351_download.jpg
  }

 

  // escape regex special chars
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  const nameRegex = new RegExp(`^${escapeRegex(payload.name as string)}$`, 'i');

  // search DB case-insensitively for the exact name within the same category
  const existing = await SubCategory.findOne({ name: { $regex: nameRegex }, categoryId: payload.categoryId, isDeleted: false });
  if (existing) {
    throw new AppError(httpStatus.CONFLICT, 'SubCategory with this name already exists for the category');
  }

  const result = await SubCategory.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create SubCategory');
  }

  return result;
};

const getAllSubCategorysFromDB = async (query: Record<string, unknown>) => {
  const SubCategoryQuery = new QueryBuilder(
    SubCategory.find().populate('categoryId', 'name'),
    query
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
    meta
  };
};

const getSingleSubCategoryFromDB = async (id: string) => {
  const result = await SubCategory.findById(id);

  return result;
};

const updateSubCategoryIntoDB = async (
  id: string,
  payload: any,
  file?: any
) => {
  if (file) {
    payload.img = file.location;
  }

  const isDeletedService = await mongoose.connection
    .collection('subcategories')
    .findOne({ _id: new mongoose.Types.ObjectId(id) });

  if (!isDeletedService) {
    throw new Error('SubCategory not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted SubCategory');
  }

  if (payload.name && typeof payload.name === 'string') {

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^${escapeRegex(payload.name)}$`, 'i');
 
    const categoryToCheck = payload.categoryId || isDeletedService.categoryId;

    const existing = await SubCategory.findOne({
      _id: { $ne: new mongoose.Types.ObjectId(id) },
      name: { $regex: nameRegex },
      categoryId: categoryToCheck,
      isDeleted: false,
    });

    if (existing) {
      throw new AppError(httpStatus.CONFLICT, 'SubCategory with this name already exists for the category');
    }
  }

  const updatedData = await SubCategory.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true }
  );

  if (!updatedData) {
    throw new Error('SubCategory not found after update');
  }

  return updatedData;
};

const deleteSubCategoryFromDB = async (id: string) => {
  const deletedService = await SubCategory.findByIdAndDelete(id);

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete SubCategory');
  }

  return deletedService;
};

const getAllSubCategorysByCategoryIdFromDB = async (categoryId: string, query: Record<string, unknown>) => {
  const SubCategoryQuery = new QueryBuilder(
    SubCategory.find().populate('categoryId', 'name'),
    query
  )
    .search(SUBCATEGORY_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
  const result = await SubCategory.find({ categoryId, isDeleted: false });
  // const meta = await SubCategory.countDocuments({ categoryId, isDeleted: false });

  return result
  // meta

}

export const SubCategoryServices = {
  createSubCategoryIntoDB,
  getAllSubCategorysFromDB,
  getSingleSubCategoryFromDB,
  updateSubCategoryIntoDB,
  deleteSubCategoryFromDB,
  getAllSubCategorysByCategoryIdFromDB
};
