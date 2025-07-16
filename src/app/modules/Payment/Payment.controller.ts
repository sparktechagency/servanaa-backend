/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentServices } from './Payment.service';
import { Buffer } from 'buffer';

// import Stripe from 'stripe';
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;



// const webhook = catchAsync(async (req, res) => {
//   const sig = req.headers['stripe-signature'] as string;
//   const rawBody = req.body; // raw body as buffer/string from middleware
//   try {
//     await PaymentServices.processWebhook(rawBody, sig);

//     sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Payment is created succesfully',
//     data: { received: true },
//   });

//   } catch (error: any) {
//     res.status(400).send(`Webhook Error: ${error.message}`);
//   }
// });
const webhook = catchAsync(async (req, res) => {


console.log('Raw body length:', req.body.length);
console.log('Raw body first 200 chars:', req.body.toString('utf8', 0, 200));
console.log('Stripe signature:', req.headers['stripe-signature']);

  console.log('Raw body type:', typeof req.body);
  console.log('Is Buffer:', Buffer.isBuffer(req.body));

  const sig = req.headers['stripe-signature'] as string;
  const rawBody = req.body; // Buffer, thanks to express.raw()

  try {
    await PaymentServices.processWebhook(rawBody, sig);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Webhook received',
      data: { received: true },
    });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});


const createPayment = catchAsync(async (req, res) => {
  // const { payment: PaymentData } = req.body;
  // const result = await PaymentServices.createPaymentIntoDB(PaymentData);
  const result = await PaymentServices.createPaymentIntoDB(req.body);
  console.log('result', result)
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is created successfully',
    data: result,
  });
});

const getSinglePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentServices.getSinglePaymentFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is retrieved successfully',
    data: result,
  });
});

const getAllPayments = catchAsync(async (req, res) => {
  const result = await PaymentServices.getAllPaymentsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payments are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updatePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { Payment } = req.body;
  const result = await PaymentServices.updatePaymentIntoDB(id, Payment);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is updated successfully',
    data: result,
  });
});

const deletePayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PaymentServices.deletePaymentFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment is deleted successfully',
    data: result,
  });
});

export const PaymentControllers = {
  createPayment,
  getSinglePayment,
  getAllPayments,
  updatePayment,
  deletePayment,
  webhook,
};
