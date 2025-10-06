/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import { SubscriptionService } from './Subscription.service';
import sendResponse from '../../utils/sendResponse';
import Stripe from 'stripe';
import config from '../../config';
import { User } from '../User/user.model';

const stripe = new Stripe(config.stripe_secret_key!);

// create subscription
const initializeDefaultPlans = catchAsync(async (req: any, res: any) => {
  try {
    const result = await SubscriptionService.initializeDefaultPlans();

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: result.message,
      data: result.plans
    });
  } catch (error: any) {
    console.error('❌ Plans initialization failed:', error);

    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: `Failed to initialize plans: ${error.message}`,
      data: null
    });
  }
});

const createSubscriptionPlan = catchAsync(async (req: any, res: any) => {
  const result = await SubscriptionService.createSubscriptionPlan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription plan created successfully',
    data: result
  });
});

const changeSubscriptionPlan = catchAsync(async (req: any, res: any) => {
  const { userEmail } = req.user;
  const { planType, prorate = true } = req.body;

  const userDoc = await User.findOne({ email: userEmail }).populate(
    'contractor'
  );

  if (!userDoc?.contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  }

  const contractorId = (userDoc.contractor as any)._id.toString();

  const result = await SubscriptionService.changeSubscriptionPlan(
    contractorId,
    planType,
    prorate
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result
  });
});

const getAllSubscriptionPlans = catchAsync(async (req: any, res: any) => {
  const result = await SubscriptionService.getAllSubscriptionPlans(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plans retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const getSingleSubscriptionPlan = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await SubscriptionService.getSingleSubscriptionPlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan retrieved successfully',
    data: result
  });
});

const updateSubscriptionPlan = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await SubscriptionService.updateSubscriptionPlan(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result
  });
});

const deleteSubscriptionPlan = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await SubscriptionService.deleteSubscriptionPlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: result
  });
});

// Contractor Subscription Controllers
const createCheckoutSession = catchAsync(async (req: any, res: any) => {
  const { userEmail } = req.user;
  const { planType } = req.body;

  const userDoc = await User.findOne({ email: userEmail }).populate(
    'contractor'
  );

  if (!userDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!userDoc.contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  }

  const contractorId = (userDoc.contractor as any)._id.toString();

  const result = await SubscriptionService.createCheckoutSession(
    contractorId,
    planType
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Checkout session created successfully',
    data: result
  });
});

const getMySubscription = catchAsync(async (req: any, res: any) => {
  const { userEmail } = req.user;

  const userDoc = await User.findOne({ email: userEmail }).populate(
    'contractor'
  );

  if (!userDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!userDoc.contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  }

  const contractorId = (userDoc.contractor as any)._id.toString();

  const result = await SubscriptionService.getSubscriptionByContractorId(
    contractorId
  );

  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'No subscription found for this contractor'
    );
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result
  });
});

const cancelSubscription = catchAsync(async (req: any, res: any) => {
  const { userEmail } = req.user;

  // Use same approach as getMySubscription for consistency
  const userDoc = await User.findOne({ email: userEmail }).populate(
    'contractor'
  );

  if (!userDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!userDoc.contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  }

  const contractorId = (userDoc.contractor as any)._id.toString();

  const result = await SubscriptionService.cancelSubscription(contractorId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription cancelled successfully',
    data: result
  });
});

// Admin Controllers
const getAllSubscriptions = catchAsync(async (req: any, res: any) => {
  const result = await SubscriptionService.getAllSubscriptions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptions retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const getSingleSubscription = catchAsync(async (req: any, res: any) => {
  const { id } = req.params;
  const result = await SubscriptionService.getSingleSubscription(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result
  });
});

const handleWebhook = catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = config.stripe_webhook_secret!;

  if (!sig) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Missing Stripe signature header'
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`
    );
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // This event means the subscription is active or changed!
      await SubscriptionService.handleSubscriptionCreated(
        event.data.object as Stripe.Subscription
      );
      break;
    case 'customer.subscription.deleted':
      await SubscriptionService.handleSubscriptionCancelled(
        event.data.object as Stripe.Subscription
      );
      break;
    case 'invoice.payment_failed':
      await SubscriptionService.handlePaymentFailed(
        event.data.object as Stripe.Invoice
      );
      break;
    // You can add more cases if needed (but don't print the invoice)
    default:
      break;
  }

  res.json({ received: true });
});

// Admin revenue analytics controllers
const getRevenueSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  console.log('Hitting URL');
  const dateRange = {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  };

  const result = await SubscriptionService.getRevenueSummary(dateRange);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Revenue summary retrieved successfully',
    data: result
  });
});

const getMonthlyRevenue = catchAsync(async (req, res) => {
  const { year } = req.query;
  const targetYear = year ? parseInt(year as string) : undefined;

  const result = await SubscriptionService.getMonthlyRevenue(targetYear);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Monthly revenue data retrieved successfully',
    data: result
  });
});

const getRevenueByPlan = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateRange = {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  };

  const result = await SubscriptionService.getRevenueByPlan(dateRange);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Revenue by plan retrieved successfully',
    data: result
  });
});

const getMRRAnalytics = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getMRRAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'MRR analytics retrieved successfully',
    data: result
  });
});

const getRevenueTrends = catchAsync(async (req, res) => {
  const { months } = req.query;
  const trendMonths = months ? parseInt(months as string) : 12;

  const result = await SubscriptionService.getRevenueTrends(trendMonths);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Revenue trends retrieved successfully',
    data: result
  });
});

export const SubscriptionControllers = {
  createSubscriptionPlan,
  getAllSubscriptionPlans,
  getSingleSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  createCheckoutSession,
  getMySubscription,
  cancelSubscription,
  getAllSubscriptions,
  getSingleSubscription,
  handleWebhook,
  initializeDefaultPlans,
  changeSubscriptionPlan,
  getRevenueSummary,
  getMonthlyRevenue,
  getRevenueByPlan,
  getMRRAnalytics,
  getRevenueTrends
};
