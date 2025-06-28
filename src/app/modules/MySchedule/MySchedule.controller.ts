import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { MyScheduleServices } from './MySchedule.service';

const createMySchedule = catchAsync(async (req, res) => {
  const MyScheduleData = req.body;
  console.log(MyScheduleData, 'MyScheduleData')
  const result = await MyScheduleServices.createMyScheduleIntoDB(MyScheduleData, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MySchedule is created and Contractor updated successfully',
    data: result,
  });
});

const getSingleMySchedule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await MyScheduleServices.getSingleMyScheduleFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MySchedule is retrieved successfully',
    data: result,
  });
});

const getAllMySchedules = catchAsync(async (req, res) => {
  const result = await MyScheduleServices.getAllMySchedulesFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MySchedules are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateMySchedule = catchAsync(async (req, res) => {
  // const { id } = req.params;
  const MySchedule = req.body;
  const result = await MyScheduleServices.updateMyScheduleIntoDB(MySchedule, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MySchedule is updated successfully',
    data: result,
  });
});

const deleteMySchedule = catchAsync(async (req, res) => {
  // const { id } = req.params;
  const result = await MyScheduleServices.deleteMyScheduleFromDB( req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MySchedule is deleted successfully',
    data: result,
  });
});

export const MyScheduleControllers = {
  createMySchedule,
  getSingleMySchedule,
  getAllMySchedules,
  updateMySchedule,
  deleteMySchedule,
};
