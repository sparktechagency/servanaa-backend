/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { UploadServices } from './Upload.service'
import sendResponse from '../../utils/sendResponse';


const createUpload = catchAsync(async (req, res) => {

  const result = await UploadServices.createUploadIntoDB(req.file as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upload is created successfully',
    data: result,
  });
});

const getSingleUpload = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UploadServices.getSingleUploadFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upload is retrieved successfully',
    data: result,
  });
});

const getAllUploads = catchAsync(async (req, res) => {
  const result = await UploadServices.getAllUploadsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Uploads are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateUpload = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { Upload } = req.body;
  const result = await UploadServices.updateUploadIntoDB(id, Upload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upload is updated successfully',
    data: result,
  });
});

const deleteUpload = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UploadServices.deleteUploadFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Upload is deleted successfully',
    data: result,
  });
});

export const UploadControllers = {
  createUpload,
  getSingleUpload,
  getAllUploads,
  updateUpload,
  deleteUpload,
};
