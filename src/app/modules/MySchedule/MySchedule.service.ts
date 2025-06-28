/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { MYSCHEDULE_SEARCHABLE_FIELDS } from './MySchedule.constant';
import mongoose from 'mongoose';
import { TMySchedule } from './MySchedule.interface';
import { MySchedule } from './MySchedule.model';
import { User } from '../User/user.model';
import { Contractor } from '../Contractor/Contractor.model';

const createMyScheduleIntoDB = async (
  payload: TMySchedule,
  user:any
) => {

const usr =  await User.findOne({email:user.userEmail}).populate('contractor')
const id = usr?.contractor?._id

const mySchedule = await MySchedule.create(payload);
  if (!mySchedule) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create MySchedule');
  }

  const updatedData = await Contractor.findByIdAndUpdate(
    { _id: id },
    {
    myScheduleId: mySchedule._id
   },
    { new: true, runValidators: true },
  ).populate('myScheduleId');


  return  updatedData ;
};

const getAllMySchedulesFromDB = async (query: Record<string, unknown>) => {
  const MyScheduleQuery = new QueryBuilder(
    MySchedule.find(),
    query,
  )
    .search(MYSCHEDULE_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await MyScheduleQuery.modelQuery;
  const meta = await MyScheduleQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleMyScheduleFromDB = async (id: string) => {
  const result = await MySchedule.findById(id);

  return result;
};

const updateMyScheduleIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('myschedules')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('MySchedule not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted MySchedule');
  }

  const updatedData = await MySchedule.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('MySchedule not found after update');
  }

  return updatedData;
};

const deleteMyScheduleFromDB = async (id: string) => {
  const deletedService = await MySchedule.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete MySchedule');
  }

  return deletedService;
};

export const MyScheduleServices = {
  createMyScheduleIntoDB,
  getAllMySchedulesFromDB,
  getSingleMyScheduleFromDB,
  updateMyScheduleIntoDB,
  deleteMyScheduleFromDB,
};
