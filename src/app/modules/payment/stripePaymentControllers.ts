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

const webhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;


  try {
    event = stripe.webhooks.constructEvent(req.rawBody!, sig, endpointSecret!);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful!', paymentIntent);
      break;
    }
    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer;
      console.log('Transfer created!', transfer);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is created succesfully',
    data: { received: true },
  });
});

const createStripePayment = catchAsync(async (req, res) => {
  const result =
    await PaymentServices.createSingleStripePaymentIntoDB(req.user,req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment Intent is created succesfully',
    data: result,
  });
});
const createStripeCheckoutSession = catchAsync(async (req, res) => {
  const result =
    await PaymentServices.createStripeCheckoutSessionIntoDB(req.user,req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment checkout is created succesfully',
    data: result,
  });
});
const verifyStripeSession = catchAsync(async (req, res) => {

  // console.log('req.query', req.query);

  const result =
    await PaymentServices.verifyStripeSessionIntoDB( req.query?.session_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment checkout is created succesfully',
    data: result,
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

  const result =
    await PaymentServices.checkBankStatusAndTransferIntoDB(actorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: '"Bank setup complete, transfer successful"',
    data: result,
  });
});
const checkPaymentComplete = catchAsync(async (req, res) => {
  const { payment:paymentData } = req.body;
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
  webhook,
  createStripePayment,
  confirmStripePayment,
  checkAccountStatus,
  checkBankStatusAndTransfer,
  createStripeCheckoutSession,
  verifyStripeSession,
  singleWithdrawalProcess
};


