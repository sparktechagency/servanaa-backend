/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { FAQ_SEARCHABLE_FIELDS } from './Question.constant';
import mongoose from 'mongoose';
import { TFaq } from './Question.interface';
import { Faq } from './Question.model';

const createFaqIntoDB = async (
  payload: TFaq,
) => {
  const result = await Faq.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create FAQ');
  }

  return result;
};

const getAllFaqsFromDB = async (query: Record<string, unknown>) => {
  const FaqQuery = new QueryBuilder(
    Faq.find(),
    query,
  )
    .search(FAQ_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await FaqQuery.modelQuery;
  const meta = await FaqQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleFaqFromDB = async (id: string) => {
  const result = await Faq.findById(id);

  return result;
};

const updateFaqIntoDB = async (id: string, payload: any) => {

  const isDeletedService = await mongoose.connection
    .collection('questions')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
    );

  if (!isDeletedService) {
    throw new Error('Faq not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Faq');
  }

  const updatedData = await Faq.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Faq not found after update');
  }

  return updatedData;
};

const deleteFaqFromDB = async (id: string) => {
  const deletedService = await Faq.findByIdAndDelete(
    id,
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Faq');
  }

  return deletedService;
};

export const FaqServices = {
  createFaqIntoDB,
  getAllFaqsFromDB,
  getSingleFaqFromDB,
  updateFaqIntoDB,
  deleteFaqFromDB,
};
