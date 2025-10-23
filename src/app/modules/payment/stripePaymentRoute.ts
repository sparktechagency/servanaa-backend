import express from 'express';
import { PaymentControllers } from './stripePaymentControllers';
import { USER_ROLE } from '../User/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/create-checkout-session',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  PaymentControllers.createStripeCheckoutSession,
);

router.post(
  '/create-checkout-subscriptions',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  PaymentControllers.createStripeSubscriptionSessionIntoDB,
);

router.get(
  '/stripe/success',
  PaymentControllers.verifyStripeSession,
);

router.post('/confirm-payment', PaymentControllers.confirmStripePayment);
router.get('/check-account-status', PaymentControllers.checkAccountStatus);

router.patch('/withdraw',
  auth(USER_ROLE.contractor),
  PaymentControllers.withdrawalBalanceProcess);

router.get('/withdraw',
  auth(USER_ROLE.contractor),
  PaymentControllers.getWithdrawalList);
// ======================================
router.get('/withdraw_list',
  auth(USER_ROLE.superAdmin),
  PaymentControllers.getWithdrawalListAdmin);


export const PaymentRoutes = router;
export const handleStripeWebhook = router;



