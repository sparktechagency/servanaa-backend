/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
// Not using QueryBuilder here; implement query handling inline
import AppError from '../../errors/AppError';
import { FAQ_SEARCHABLE_FIELDS } from './Question.constant';
import mongoose from 'mongoose';
import { TFaq } from './Question.interface';
import { Faq } from './Question.model';

const createFaqIntoDB = async (payload: TFaq) => {

  const exist = await Faq.findOne({ subCategoryId: payload.subCategoryId })
  if (exist) {
    payload.question = [...new Set(payload.question)];
    const updatedFaq = await Faq.findByIdAndUpdate(exist._id, payload, { new: true });
    return updatedFaq;
  }

  payload.question = [...new Set(payload.question)];
  const result = await Faq.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create FAQ');
  }

  return result;
};

const getAllFaqsFromDB = async (query: Record<string, unknown>) => {
  const page = Number((query as any)?.page) || 1;
  const limit = Number((query as any)?.limit) || 10;
  const skip = (page - 1) * limit;

  const mongooseQuery = Faq.find().populate('subCategoryId', 'name img').skip(skip).limit(limit);

  const result = await mongooseQuery;

  const total = await Faq.countDocuments();
  const totalPage = Math.ceil(total / limit);

  const meta = { page, limit, total, totalPage };

  return { result, meta };
};

const getSingleFaqFromDB = async (id: string) => {
  const result = await Faq.findById(id).populate('subCategoryId', 'name img');

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
