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
    // req.body should be a Buffer at this point, not parsed JSON
    console.log('🔍 Webhook body type:', typeof req.body);
    console.log('🔍 Webhook body is Buffer:', Buffer.isBuffer(req.body));
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Webhook signature verification failed: ${err.message}`
    );
  }

  console.log(`🔔 Received webhook event: ${event.type} - ${event.id}`);

  switch (event.type) {
    // 🔥 ADD THIS MISSING CASE:
    case 'customer.subscription.created':
      await SubscriptionService.handleSubscriptionCreated(
        event.data.object as Stripe.Subscription
      );
      break;
    case 'checkout.session.completed':
      await SubscriptionService.handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;

    // 🔥 HANDLE BOOKING PAYMENT SUCCESS
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.type === 'booking_payment') {
        await handleBookingPaymentSuccess(paymentIntent);
      }
      break;
    }

    // 🔥 HANDLE BOOKING PAYMENT FAILURE
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      if (failedPayment.metadata?.type === 'booking_payment') {
        await handleBookingPaymentFailed(failedPayment);
      }
      break;
    }

    // Handle transfer completion
    case 'transfer.created':
      await handleTransferCreated(event.data.object as Stripe.Transfer);
      break;

    // 🔥 MODIFY THIS CASE - Remove the billing_reason check:
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        await SubscriptionService.handleSubscriptionCreated(stripeSubscription);
      }
      break;
    }

    case 'customer.subscription.deleted':
      // eslint-disable-next-line no-case-declarations
      const cancelledSubscription = event.data.object as Stripe.Subscription;
      await SubscriptionService.handleSubscriptionCancelled(
        cancelledSubscription
      );
      break;

    case 'invoice.payment_failed':
      // eslint-disable-next-line no-case-declarations
      const failedInvoice = event.data.object as Stripe.Invoice;
      await SubscriptionService.handlePaymentFailed(failedInvoice);
      break;
  }

  res.json({ received: true });
});

// NEW: Handle booking payment success
const handleBookingPaymentSuccess = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const { bookingId } = paymentIntent.metadata;

  console.log(`✅ Booking payment succeeded for booking: ${bookingId}`);

  // Update booking status in database
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'paid',
    status: 'ongoing',
    paidAt: new Date(),
    stripeChargeId: paymentIntent.latest_charge // Store charge ID
  });

  // TODO: Send notification to contractor about confirmed booking
  // TODO: Send confirmation email to customer
};

// 🔥 NEW: Handle booking payment failure
const handleBookingPaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const { bookingId } = paymentIntent.metadata;

  console.log(`❌ Booking payment failed for booking: ${bookingId}`);

  // Update booking status
  await Booking.findByIdAndUpdate(bookingId, {
    paymentStatus: 'failed',
    status: 'cancelled',
    failedAt: new Date()
  });

  // TODO: Send failure notification
  // TODO: Release reserved time slots
};

// NEW: Handle transfer completion
const handleTransferCreated = async (transfer: Stripe.Transfer) => {
  const { bookingId, type } = transfer.metadata;

  if (type !== 'contractor_payout') return;

  // Update booking with contractor payout information
  await Booking.findByIdAndUpdate(bookingId, {
    contractorPayout: {
      transferId: transfer.id,
      amount: transfer.amount / 100, // Convert from cents
      transferredAt: new Date()
    }
  });

  console.log(`✅ Funds transferred to contractor for booking: ${bookingId}`);

  // TODO: Send notification to contractor about payout
  // TODO: Send final receipt to customer
};

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
  handleBookingPaymentSuccess,
  initializeDefaultPlans,
  changeSubscriptionPlan,
  getRevenueSummary,
  getMonthlyRevenue,
  getRevenueByPlan,
  getMRRAnalytics,
  getRevenueTrends
};
