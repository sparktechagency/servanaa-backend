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
import { BookingServices } from '../Booking/Booking.service';
import { Withdraw } from '../payment/stripe.model';

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
//=========================================

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

// Get All Plans
const getAllPlans = catchAsync(async (req, res) => {
  const result = await SubscriptionService.getAllPlans();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Plans retrieved successfully',
    data: result,
  });
});


// Update Plan
const updatePlan = catchAsync(async (req, res) => {
  const result = await SubscriptionService.updatePlan(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan updated successfully',
    data: result,
  });
});

// Delete Plan
const deletePlan = catchAsync(async (req, res) => {
  const result = await SubscriptionService.deletePlan(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscription plan deleted successfully',
    data: result,
  });
});
// =======================================================

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
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Missing Stripe signature header');
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

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        const chargeId = paymentIntent.latest_charge as string | undefined;
        let receipt_url: string | any;
        let transactionId: string | any;

        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          console.log(JSON.stringify(charge))
          transactionId = charge.balance_transaction;
          receipt_url = charge.receipt_url;
        }

        if (metadata?.type === 'booking_payment') {
          const bookingObjId = metadata.bookingId;

          await BookingServices.handlePaymentSuccess({
            payUser: metadata.payUser,
            bookingId: bookingObjId,
            amount: metadata.amount,
            stripeChargeId: chargeId,
            stripePaymentIntentId: paymentIntent.id,
            receipt_url: receipt_url
          });
        }

        if (metadata?.type === 'booking_update') {
          const bookingObjId = metadata.bookingId;

          await BookingServices.handlePaymentSuccessUpdateBooking({
            payUser: metadata.payUser,
            bookingId: bookingObjId,
            amount: metadata.amount,
            stripeChargeId: chargeId,
            stripePaymentIntentId: paymentIntent.id,
            receipt_url: receipt_url
          });
        }


        break;
      }


      // booking_update
      case 'checkout.session.completed':
      case 'invoice.payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        console.log('Checkout Session Metadata:', metadata);

        if (metadata.type === 'subscription') {
          const subscriptionId = metadata.subscriptionId;
          const payUser = metadata.payUser;
          const amount = metadata.amount;

          // Retrieve subscription to get charge info
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string, {
            expand: ['latest_invoice.payment_intent'],
          });

          // @ts-ignore
          const paymentIntent = stripeSub.latest_invoice?.payment_intent as Stripe.PaymentIntent;
          const chargeId = paymentIntent?.latest_charge as string | undefined;
          let receipt_url = '';
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId);
            receipt_url = charge.receipt_url || '';
          }

          await SubscriptionService.handleSubscriptionCreated({
            payUser,
            subscriptionId,
            amount,
            stripeChargeId: chargeId || '',
            stripePaymentIntentId: paymentIntent?.id || '',
            receipt_url,
          });
        }

        break;
      }

      // ------------------- Payout Paid (Withdrawal Success) -------------------
      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;

        const withdrawal = await Withdraw.findOneAndUpdate(
          { payoutId: payout.id },
          { status: 'received', date: new Date() },
          { new: true }
        );

        if (withdrawal) {
          console.log(`✅ Withdrawal ${withdrawal._id} marked as received.`);
        } else {
          console.warn(`⚠️ No matching withdrawal found for payout ${payout.id}`);
        }
        break;
      }

      // ------------------- Payout Failed (Withdrawal Failed) -------------------
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;

        const withdrawal = await Withdraw.findOneAndUpdate(
          { payoutId: payout.id },
          { status: 'rejected', date: new Date() },
          { new: true }
        );

        if (withdrawal) {
          console.log(`❌ Withdrawal ${withdrawal._id} failed.`);
        } else {
          console.warn(`⚠️ No matching withdrawal found for payout ${payout.id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed':
      case 'invoice.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;

        if (failedPayment.metadata?.type === 'booking_payment') {
          const { bookingId } = failedPayment.metadata;
          if (bookingId) {
            await Booking.findOneAndUpdate(
              { bookingId },
              {
                paymentStatus: 'failed',
                failedAt: new Date(),
              }
            );
          }
        }
        break;
      }



      default:
        console.log(`⚠️ Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});


const getRevenueSummary = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

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
  // ====
  getAllPlans,
  updatePlan,
  deletePlan,
  // ======
  getRevenueSummary,
  getMonthlyRevenue,
  getRevenueByPlan,
  getMRRAnalytics,
  getRevenueTrends
};
