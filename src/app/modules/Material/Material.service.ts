/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { MATERIAL_SEARCHABLE_FIELDS } from './Material.constant';
import mongoose from 'mongoose';
import { TMaterial } from './Material.interface';
import { Material } from './Material.model';

const createMaterialIntoDB = async (
  payload: TMaterial,
) => {
  const result = await Material.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Material');
  }

  return result;
};

const getAllMaterialsFromDB = async (query: Record<string, unknown>) => {
  const MaterialQuery = new QueryBuilder(
    Material.find(),
    query,
  )
    .search(MATERIAL_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MaterialQuery.modelQuery;
  const meta = await MaterialQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleMaterialFromDB = async (id: string) => {
  const result = await Material.findById(id);

  return result;
};

const updateMaterialIntoDB = async (id: string, payload: any) => {
 

  const isDeletedService = await mongoose.connection
    .collection('materials')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Material not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Material');
  }

  const updatedData = await Material.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Material not found after update');
  }

  return updatedData;
};

const deleteMaterialFromDB = async (id: string) => {
  const deletedService = await Material.findByIdAndDelete(
    id,
    { isDeleted: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Material');
  }

  return deletedService;
};

export const MaterialServices = {
  createMaterialIntoDB,
  getAllMaterialsFromDB,
  getSingleMaterialFromDB,
  updateMaterialIntoDB,
  deleteMaterialFromDB,
};
