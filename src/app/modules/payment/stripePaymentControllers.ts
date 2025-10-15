/* eslint-disable no-undef */
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentServices } from './stripePaymentService';
import config from '../../config';
import { Stripe } from 'stripe';
const endpointSecret = config.stripe_webhook_secret; // Ensure this is set in your config
const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2024-06-20',
});

const createStripeCheckoutSession = catchAsync(async (req, res) => {
  const result =
    await PaymentServices.createStripeCheckoutSessionIntoDB(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment checkout is created successfully',
    data: result,
  });
});

const createStripeSubscriptionSessionIntoDB = catchAsync(async (req, res) => {
  const result =
    await PaymentServices.createStripeSubscriptionSessionIntoDB(req.user, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment checkout is created successfully',
    data: result,
  });
});


const verifyStripeSession = catchAsync(async (req, res) => {

  // const result =
  //   await PaymentServices.verifyStripeSessionIntoDB(req.query?.session_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment checkout is created successfully',
    data: '',
  });
});


const confirmStripePayment = catchAsync(async (req, res) => {
  const { client_secret } = req.body;
  const result =
    await PaymentServices.confirmStripePaymentIntoDB(client_secret);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is created succesfully',
    data: result,
  });
});
const checkAccountStatus = catchAsync(async (req, res) => {
  const { actorId } = req.query;

  const result =
    await PaymentServices.checkAccountStatusIntoDB(actorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '"Bank setup complete, transfer successful"',
    data: result,
  });
});

const checkBankStatusAndTransfer = catchAsync(async (req, res) => {
  const { actorId } = req.query;

  const result = await PaymentServices.checkBankStatusAndTransferIntoDB(actorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bank setup complete, transfer successful",
    data: result,
  });
});

const checkPaymentComplete = catchAsync(async (req, res) => {
  const { payment: paymentData } = req.body;
  const result =
    await PaymentServices.checkPaymentCompletefromDB(req.user, paymentData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment have already been made',
    data: result,
  });
});

const singleWithdrawalProcess = catchAsync(async (req, res) => {
  const transactionData = req.body;
  const result = await PaymentServices.singleWithdrawalProcessIntoDB(
    transactionData,
    req.user,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal Process is created succesfully',
    data: result,
  });
});

export const PaymentControllers = {
  checkPaymentComplete,
  // webhook,
  // createStripePayment,
  confirmStripePayment,
  checkAccountStatus,
  checkBankStatusAndTransfer,
  createStripeCheckoutSession,
  verifyStripeSession,
  singleWithdrawalProcess,
  createStripeSubscriptionSessionIntoDB
};


