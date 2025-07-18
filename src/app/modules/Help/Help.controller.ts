import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { HelpServices } from './Help.service';

const createHelp = catchAsync(async (req, res) => {
  const help = req.body;
  const result = await HelpServices.createHelpIntoDB(help, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Help is created successfully',
    data: result,
  });
});

const getSingleHelp = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HelpServices.getSingleHelpFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Help is retrieved successfully',
    data: result,
  });
});

const getAllHelps = catchAsync(async (req, res) => {
  const result = await HelpServices.getAllHelpsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Helps are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateHelp = catchAsync(async (req, res) => {
  const { id } = req.params;
  const help = req.body;
  const result = await HelpServices.updateHelpIntoDB(id, help);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Help is updated successfully',
    data: result,
  });
});

const deleteHelp = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await HelpServices.deleteHelpFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Help is deleted successfully',
    data: result,
  });
});

export const HelpControllers = {
  createHelp,
  getSingleHelp,
  getAllHelps,
  updateHelp,
  deleteHelp,
};
