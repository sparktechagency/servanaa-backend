/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CONTRACTOR_SEARCHABLE_FIELDS } from './Contractor.constant';
import mongoose from 'mongoose';
import { Contractor } from './Contractor.model';


const getAllContractorsFromDB = async (query: Record<string, unknown>) => {
  const ContractorQuery = new QueryBuilder(
    Contractor.find(),
    query,
  )
    .search(CONTRACTOR_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ContractorQuery.modelQuery;
  const meta = await ContractorQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleContractorFromDB = async (id: string) => {
  const result = await Contractor.findById(id).populate('myScheduleId');

  return result;
};

const updateContractorIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('contractors')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('Contractor not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Contractor');
  }

  const updatedData = await Contractor.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Contractor not found after update');
  }

  return updatedData;
};

const deleteContractorFromDB = async (id: string) => {
  const deletedService = await Contractor.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Contractor');
  }

  return deletedService;
};

export const ContractorServices = {
  getAllContractorsFromDB,
  getSingleContractorFromDB,
  updateContractorIntoDB,
  deleteContractorFromDB,
};
