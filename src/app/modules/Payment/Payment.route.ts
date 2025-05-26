import express from 'express';
import { PaymentControllers } from './Payment.controller';
import validateRequest from '../../middlewares/validateRequest';
import {  updatePaymentValidationSchema } from './Payment.validation';
// import bodyParser from 'body-parser';

// import { createPaymentValidationSchema, updatePaymentValidationSchema } from './Payment.validation';

const router = express.Router();

router.post(
  '/create-payment-intent',
  // validateRequest(createPaymentValidationSchema),
  PaymentControllers.createPayment,
);


// Add the webhook route using raw body parser middleware specifically for webhook
// router.post(
//   '/webhook',
//   bodyParser.raw({ type: 'application/json' }),
//   PaymentControllers.webhook,
// );


router.get(
  '/:id',
  PaymentControllers.getSinglePayment,
);

router.patch(
  '/:id',
  validateRequest(updatePaymentValidationSchema),
  PaymentControllers.updatePayment,
);

router.delete(
  '/:id',
  PaymentControllers.deletePayment,
);

router.get(
  '/',
  PaymentControllers.getAllPayments,
);

export const PaymentRoutes = router;
