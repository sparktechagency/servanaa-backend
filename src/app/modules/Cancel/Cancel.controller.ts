import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CancelServices } from './Cancel.service';

const createCancel = catchAsync(async (req, res) => {
  const cancel = req.body;
  const result = await CancelServices.createCancelIntoDB(cancel);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cancel is created successfully',
    data: result,
  });
});

const getSingleCancel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CancelServices.getSingleCancelFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cancel is retrieved successfully',
    data: result,
  });
});

const getAllCancels = catchAsync(async (req, res) => {
  const result = await CancelServices.getAllCancelsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cancels are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateCancel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cancel = req.body;
  const result = await CancelServices.updateCancelIntoDB(id, cancel);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cancel is updated successfully',
    data: result,
  });
});

const deleteCancel = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await CancelServices.deleteCancelFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cancel is deleted successfully',
    data: result,
  });
});

export const CancelControllers = {
  createCancel,
  getSingleCancel,
  getAllCancels,
  updateCancel,
  deleteCancel,
};
