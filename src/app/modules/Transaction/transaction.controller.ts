/* eslint-disable no-undef */
// import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { TransactionServices } from './transaction.service';
// import { TransactionServices } from './transaction.service';


const createSingleTransaction = catchAsync(async (req, res) => {
  const transactionData = req.body;
  const result = await TransactionServices.createSingleTransactionIntoDB(
    transactionData,
    req.user,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transaction is created succesfully',
    data: result,
  });
});

const getSingleTransactionRequest = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await TransactionServices.getSingleTransactionFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transaction is retrieved succesfully',
    data: result,
  });
});

const updateSingleTransaction = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { transaction: transactionData } = req.body;

  const result = await TransactionServices.updateSingleTransactionIntoDB(
    id,
    transactionData,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Transaction is updated succesfully',
    data: result,
  });
});


// const singleWithdrawalProcess = catchAsync(async (req, res) => {
//   const transactionData = req.body;
//   const result = await TransactionServices.singleWithdrawalProcessIntoDB(
//     req.user,
//     transactionData,
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Withdrawal Process is created succesfully',
//     data: result,
//   });
// });


const getAllwithdrawalRequests = catchAsync(async (req, res) => {

  const result = await TransactionServices.getAllwithdrawalRequestsFromDB(
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal Requests are retrieved succesfully',
    meta: result.meta,
    data: result.result,
  });
});
const getAllTransactions = catchAsync(async (req, res) => {

  const result = await TransactionServices.getAllTransactionsFromDB(
    req.query,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All Transactions Requests are retrieved succesfully',
    meta: result.meta,
    data: result.result,
  });
});



export const TransactionControllers = {
  createSingleTransaction,
  getSingleTransactionRequest,
  updateSingleTransaction,
//   singleWithdrawalProcess,
  getAllwithdrawalRequests,
  getAllTransactions,

};

