import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TransactionHistoryServices } from './TransactionHistory.service';

const createTransactionHistory = catchAsync(async (req, res) => {
  const { TransactionHistory: TransactionHistoryData } = req.body;
  const result = await TransactionHistoryServices.createTransactionHistoryIntoDB(TransactionHistoryData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'TransactionHistory is created successfully',
    data: result,
  });
});

const getSingleTransactionHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TransactionHistoryServices.getSingleTransactionHistoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'TransactionHistory is retrieved successfully',
    data: result,
  });
});

const getAllTransactionHistorys = catchAsync(async (req, res) => {
  const result = await TransactionHistoryServices.getAllTransactionHistorysFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'TransactionHistorys are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateTransactionHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { TransactionHistory } = req.body;
  const result = await TransactionHistoryServices.updateTransactionHistoryIntoDB(id, TransactionHistory);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'TransactionHistory is updated successfully',
    data: result,
  });
});

const deleteTransactionHistory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TransactionHistoryServices.deleteTransactionHistoryFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'TransactionHistory is deleted successfully',
    data: result,
  });
});

export const TransactionHistoryControllers = {
  createTransactionHistory,
  getSingleTransactionHistory,
  getAllTransactionHistorys,
  updateTransactionHistory,
  deleteTransactionHistory,
};
