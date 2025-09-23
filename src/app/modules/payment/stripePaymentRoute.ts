import express from 'express';
import { PaymentControllers } from './stripePaymentControllers';
import { USER_ROLE } from '../User/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/create-payment-intent',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  PaymentControllers.createStripePayment,
);
router.post(
  '/check-payment-complete',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  PaymentControllers.checkPaymentComplete,
);
router.post('/confirm-payment', PaymentControllers.confirmStripePayment);
router.post('/webhook', PaymentControllers.webhook);
router.get('/check-account-status', PaymentControllers.checkAccountStatus);
router.get('/check-bank-status', PaymentControllers.checkBankStatus);

export const PaymentRoutes = router;
export const handleStripeWebhook = router;



