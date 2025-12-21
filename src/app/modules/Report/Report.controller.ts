import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReportServices } from './Report.service';

const createReport = catchAsync(async (req, res) => {
  const ReportData = req.body;
  const result = await ReportServices.createReportIntoDB(ReportData, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report is created successfully',
    data: result,
  });
});

const getSingleReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReportServices.getSingleReportFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report is retrieved successfully',
    data: result,
  });
});

const getAllReports = catchAsync(async (req, res) => {
  const result = await ReportServices.getAllReportsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reports are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const Report = req.body;
  const result = await ReportServices.updateReportIntoDB(id, Report);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report is updated successfully',
    data: result,
  });
});

const deleteReport = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReportServices.deleteReportFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report is deleted successfully',
    data: result,
  });
});

const accountDelete = catchAsync(async (req, res) => {
  const { name, accountId } = req.body;
  // const result = await ReportServices.deleteReportFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your request has been received successfully.',
    data: true,
  });
});

export const ReportControllers = {
  accountDelete,
  createReport,
  getSingleReport,
  getAllReports,
  updateReport,
  deleteReport,
};
