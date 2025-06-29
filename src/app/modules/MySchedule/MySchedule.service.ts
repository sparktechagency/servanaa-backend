/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { MYSCHEDULE_SEARCHABLE_FIELDS } from './MySchedule.constant';
import { TMySchedule } from './MySchedule.interface';
import { MySchedule } from './MySchedule.model';
import { User } from '../User/user.model';
import { Contractor } from '../Contractor/Contractor.model';
import mongoose from 'mongoose';

const createMyScheduleIntoDB = async (
  payload: TMySchedule,
  user:any
) => {
const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get contractor ID from authenticated user
    const usr = await User.findOne({ email: user.userEmail })
      .populate({
    path: 'contractor',
    populate: {
      path: 'myScheduleId', // this is a reference inside Contractor
    },
  }).session(session);

    const myScheduleId = (usr?.contractor as any)?.myScheduleId?._id;
    const contractorId = usr?.contractor?._id;

    if (!contractorId) {
      throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found for user');
    }

    payload.contractorId = contractorId;

// const schedule = await MySchedule.findOne({ contractorId }).session(session)
    // 2. Update schedule or create a new one
    let updatedData;
 if(myScheduleId){
     // If a schedule exists, update it
      updatedData = await MySchedule.findByIdAndUpdate(
        myScheduleId, 
        payload, 
        { new: true, runValidators: true, session }
      );

      if (!updatedData) {
        throw new AppError(httpStatus.NOT_FOUND, 'MySchedule not found after update');
      }

      console.log(updatedData, 'updatedData');
 }else {
     // 2. Create schedule
      // If no schedule exists, create a new one
      const mySchedule = await MySchedule.create([payload], { session });
      if (!mySchedule || !mySchedule[0]) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create MySchedule');
      }

      updatedData = mySchedule[0];    }

    // 3. Update contractor
    const updatedContractor = await Contractor.findByIdAndUpdate(
      contractorId,
      { myScheduleId: updatedData._id },
      { new: true, runValidators: true, session }
    ).populate('myScheduleId');

    if (!updatedContractor) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update Contractor with schedule');
    }

    await session.commitTransaction();
    session.endSession();

    return updatedContractor;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
  const session = await mongoose.startSession();
  session.startTransaction();

   try {
    // 1. Get user with nested contractor → myScheduleId
  const usr =  await User.findOne({email:user.userEmail}).select('contractor').populate({
  path: 'contractor',
  populate: {
    path: 'myScheduleId'
  }
}).session(session);

const conId = usr?.contractor?._id
const contractor =  await Contractor.findOne({_id:conId}).populate('myScheduleId').session(session);
const scheduleId = contractor?.myScheduleId?._id

    // const conId = usr?.contractor?._id;
    // const scheduleId = usr?.contractor?.myScheduleId?._id;

   if (!scheduleId || !conId) {
      throw new AppError(httpStatus.NOT_FOUND, 'Contractor or Schedule not found');
    }

        // 2. Delete schedule
    const deletedSchedule = await MySchedule.findByIdAndDelete(scheduleId, { session });
    if (!deletedSchedule) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete MySchedule');
    }

  // const deletedService = await MySchedule.findByIdAndDelete(
  //   scheduleId,
  //   // { isDeleted: true },
  //   { new: true },
  // );

  // if (!deletedService) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete MySchedule');
  // }


    // 3. Update contractor's myScheduleId to null
    const updatedContractor = await Contractor.findByIdAndUpdate(
      conId,
      { myScheduleId: null },
      { new: true, session } // ✅ attach session
    );

    if (!updatedContractor) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update Contractor');
    }


    await session.commitTransaction(); // ✅ commit
    session.endSession();

    return deletedSchedule;

  //   const updatedContractor = await Contractor.findByIdAndUpdate(
  //   conId,
  //   { myScheduleId: null },
  //   { new: true },
  // );

  
  // if (!updatedContractor) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Failed to Update Contractor');
  // }

  // return deletedService;

   } catch (error) {
    await session.abortTransaction(); // ❌ rollback
    session.endSession();
    throw error;
  }
};

export const MyScheduleServices = {
  createMyScheduleIntoDB,
  getAllMySchedulesFromDB,
  getSingleMyScheduleFromDB,
  updateMyScheduleIntoDB,
  deleteMyScheduleFromDB,
};
