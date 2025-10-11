/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import catchAsync from '../../utils/catchAsync';
import { SubscriptionService } from './Subscription.service';
import sendResponse from '../../utils/sendResponse';
import Stripe from 'stripe';
import config from '../../config';
import { Booking } from '../Booking/Booking.model';
import { User } from '../User/user.model';

const stripe = new Stripe(config.stripe_secret_key!);

// create subscription
const initializeDefaultPlans = catchAsync(async (req, res) => {
  console.log('🚀 Starting subscription plans initialization...');

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
//----------------

// Subscription Plan Controllers
const createSubscriptionPlan = catchAsync(async (req, res) => {
  const result = await SubscriptionService.createSubscriptionPlan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Subscription plan created successfully',
    data: result
  });
});

const changeSubscriptionPlan = catchAsync(async (req, res) => {
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

const getAllSubscriptionPlans = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getAllSubscriptionPlans(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plans retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const getSingleSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionService.getSingleSubscriptionPlan(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan retrieved successfully',
    data: result
  });
});

const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await SubscriptionService.updateSubscriptionPlan(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result
  });
});

const deleteSubscriptionPlan = catchAsync(async (req, res) => {
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
const createCheckoutSession = catchAsync(async (req, res) => {
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

const getMySubscription = catchAsync(async (req, res) => {
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

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription retrieved successfully',
    data: result
  });
});

const cancelSubscription = catchAsync(async (req, res) => {
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
const getAllSubscriptions = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getAllSubscriptions(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscriptions retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const getSingleSubscription = catchAsync(async (req, res) => {
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
    console.error('⚠️ Webhook signature verification failed:', err.message);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`
    );
  }

  console.log(`🔔 Received webhook event: ${event.type} - ${event.id}`);

  try {
    switch (event.type) {
      // ✅ Payment succeeded
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;
        console.log('Checkout Session Metadata:', metadata);

        if (paymentIntent.metadata?.type === 'booking_payment') {
          console.log('=====booking=======')
          // await BookingService.handlePaymentSuccess(paymentIntent);
        } else if (paymentIntent.metadata?.type === 'subscription') {
          console.log('=====subscription=======')
          // await SubscriptionService.handlePaymentSuccess(paymentIntent);
        }
        break;
      }

      // ✅ Payment failed
      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        if (failedPayment.metadata?.type === 'booking_payment') {
          const { bookingId } = failedPayment.metadata;
          await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: 'failed',
            failedAt: new Date()
          });

        } else if (failedPayment.metadata?.type === 'subscription') {
          // await SubscriptionService.handlePaymentFailed(failedPayment);
        }
        break;
      }

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
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
