/* eslint-disable no-undef */
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentServices } from './stripePaymentService';
import config from '../../config';
import { Stripe } from 'stripe';
import { User } from '../User/user.model';
import AppError from '../../errors/AppError';
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

const withdrawalBalanceProcess = catchAsync(async (req, res) => {
  const { amount } = req.body;

  console.log('Initiating withdrawal process for amount:', amount);
  const email = "amaahmadmusa71@gmail.com" as any;
  const result = await PaymentServices.withdrawalBalanceProcess(
    amount,
    // req.user.userEmail
    email,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal Process is created successfully',
    data: result,
  });
});

const getWithdrawalList = catchAsync(async (req, res) => {
  const { userEmail } = req.user;
  const { page, limit, status } = req.query;

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const result = await PaymentServices.getWithdrawalList(user._id.toString(), {
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status as string,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Withdrawal list fetched successfully',
    data: result,
  });
});



export const PaymentControllers = {
  getWithdrawalList,
  withdrawalBalanceProcess,
  confirmStripePayment,
  checkAccountStatus,
  createStripeCheckoutSession,
  verifyStripeSession,
  createStripeSubscriptionSessionIntoDB
};


