import express from 'express';
import { SubscriptionControllers } from './Subscription.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createCheckoutSessionSchema,
  changeSubscriptionPlanSchema,
  revenueAnalyticsSchema
} from './Subscription.validation';
import { requireActiveSubscription } from '../../middlewares/requireActiveSubscription';

const router = express.Router();

// subscription/subscription.routes.ts (Add this route)
router.post(
  '/initialize-plans',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.initializeDefaultPlans
);

// Subscription Plan Routes (Admin only)
router.post(
  '/plans',
  auth(USER_ROLE.superAdmin),
  validateRequest(createSubscriptionPlanSchema),
  SubscriptionControllers.createSubscriptionPlan
);

router.get(
  '/plans',
  //  auth(USER_ROLE.superAdmin,  USER_ROLE.customer,  USER_ROLE.contractor),
  SubscriptionControllers.getAllSubscriptionPlans
);

router.get('/plans/:id', SubscriptionControllers.getSingleSubscriptionPlan);

router.patch(
  '/plans/:id',
  auth(USER_ROLE.superAdmin),
  validateRequest(updateSubscriptionPlanSchema),
  SubscriptionControllers.updateSubscriptionPlan
);

router.delete(
  '/plans/:id',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.deleteSubscriptionPlan
);

// Contractor Subscription Routes
router.post(
  '/create-checkout-session',
  auth(USER_ROLE.contractor),
  validateRequest(createCheckoutSessionSchema),
  SubscriptionControllers.createCheckoutSession
);

router.get(
  '/my-subscription',
  auth(USER_ROLE.contractor),
  requireActiveSubscription,
  SubscriptionControllers.getMySubscription
);

router.post(
  '/cancel',
  auth(USER_ROLE.contractor),
  SubscriptionControllers.cancelSubscription
);

// Admin Routes
router.get(
  '/',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getAllSubscriptions
);

router.get(
  '/:id',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getSingleSubscription
);

router.patch(
  '/change-plan',
  auth(USER_ROLE.contractor),
  validateRequest(changeSubscriptionPlanSchema),
  SubscriptionControllers.changeSubscriptionPlan
);

//  validateRequest(revenueAnalyticsSchema),

router.get(
  '/revenue-summary',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getRevenueSummary
);

router.get(
  '/admin/revenue-monthly',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getMonthlyRevenue
);

router.get(
  '/admin/revenue-by-plan',
  auth(USER_ROLE.superAdmin),
  validateRequest(revenueAnalyticsSchema),
  SubscriptionControllers.getRevenueByPlan
);

router.get(
  '/admin/mrr-analytics',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getMRRAnalytics
);

router.get(
  '/admin/revenue-trends',
  auth(USER_ROLE.superAdmin),
  SubscriptionControllers.getRevenueTrends
);

export const SubscriptionRoutes = router;
