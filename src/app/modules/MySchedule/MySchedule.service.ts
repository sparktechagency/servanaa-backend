/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { MYSCHEDULE_SEARCHABLE_FIELDS } from './MySchedule.constant';
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
 if(id) payload.contractorId = id

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

const updateMyScheduleIntoDB = async ( payload: any, user:any) => {
const usr =  await User.findOne({email:user.userEmail}).select('contractor').populate({
  path: 'contractor',
  populate: {
    path: 'myScheduleId'
  }
})

const conId = usr?.contractor?._id
const contractor =  await Contractor.findOne({_id:conId}).populate('myScheduleId')
const scheduleId = contractor?.myScheduleId?._id


  // if (isDeletedService.isDeleted) {
  //   throw new Error('Cannot update a deleted MySchedule');
  // }

  const updatedData = await MySchedule.findByIdAndUpdate(
    { _id: scheduleId },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('MySchedule not found after update');
  }

  return updatedData;
};

const deleteMyScheduleFromDB = async (user: any) => {

  const usr =  await User.findOne({email:user.userEmail}).select('contractor').populate({
  path: 'contractor',
  populate: {
    path: 'myScheduleId'
  }
})

const conId = usr?.contractor?._id
const contractor =  await Contractor.findOne({_id:conId}).populate('myScheduleId')
const scheduleId = contractor?.myScheduleId?._id

  const deletedService = await MySchedule.findByIdAndDelete(
    scheduleId,
    // { isDeleted: true },
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
