/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import mongoose from 'mongoose';
import {
  Subscription,
  SubscriptionPlan,
  TSubscriptionPlan
} from './Subscription.model';
import { Contractor } from '../Contractor/Contractor.model';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import config from '../../config';
// import { User } from '../User/user.model';

const stripe = new Stripe(config.stripe_secret_key!);
const processedEvents = new Map<string, boolean>();

const PENDING_EXPIRY_MINUTES = 10;

export class SubscriptionService {
  static async initializeDefaultPlans () {
    // Check if plans already exist
    const existingPlans = await SubscriptionPlan.find();
    if (existingPlans.length > 0) {
      return { message: 'Plans already exist', plans: existingPlans };
    }

    const plans = [
      {
        name: 'Basic Plan',
        type: 'basic' as const,
        duration: 1,
        price: 49,
        features: [
          'Basic stats only',
          'Standard email support',
          'Optional custom branding ($19/month)'
        ],
        serviceAreas: 5,
        featuredListing: false,
        instantBookingEligibility: false,
        multipleStaffAccounts: false,
        jobCategories: 2,
        verifiedBadge: true,
        insightsDashboard: 'basic',
        support: 'standard',
        customerReviewBooster: false,
        customBranding: false,
        customBrandingPrice: 19
      },
      {
        name: 'Premium Plan',
        type: 'premium' as const,
        duration: 1, // monthly
        price: 99,
        features: [
          'Unlimited regions & cities',
          'Higher ranking in search & categories',
          'Eligible for auto-accept jobs',
          'Multiple staff accounts',
          'Access to all available categories',
          'Verified badge plus premium badge highlight',
          'Full access to bookings, earnings, and review breakdown',
          'Priority support + phone line',
          'Automated follow-ups to boost 5-star reviews',
          'Custom branding included (Business logo & name displayed)',
          'NEW CUSTOMERS GET FREE ACCESS FOR FIRST 6 MONTHS'
        ],
        serviceAreas: -1, // unlimited
        featuredListing: true,
        instantBookingEligibility: true,
        multipleStaffAccounts: true,
        jobCategories: -1, // all categories
        verifiedBadge: true,
        premiumBadge: true,
        insightsDashboard: 'full',
        support: 'priority',
        customerReviewBooster: true,
        customBranding: true,
        customBrandingPrice: 0, // included
        newCustomerFreeMonths: 6
      }
    ];

    const createdPlans = [];

    for (const planData of plans) {
      // Create Stripe price
      const stripePrice = await stripe.prices.create({
        unit_amount: planData.price * 100,
        currency: 'usd',
        recurring: {
          interval: 'month',
          interval_count: planData.duration
        },
        product_data: {
          name: planData.name
        }
      });

      // Create plan in database
      const plan = await SubscriptionPlan.create({
        ...planData,
        stripePriceId: stripePrice.id,
        isActive: true
      });

      createdPlans.push(plan);
    }

    return { message: 'Plans created successfully', plans: createdPlans };
  }

  static async handleWebhookEvent (event: Stripe.Event) {
    if (processedEvents.has(event.id)) {
      console.log(`🔄 Event ${event.id} already processed, skipping...`);
      return;
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;

        // Invoice events
        case 'invoice.paid':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(
            event.data.object as Stripe.Invoice
          );
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.data.object as Stripe.Invoice
          );
          break;

        case 'invoice.upcoming':
          await this.handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
          break;

        // Checkout events
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        case 'checkout.session.expired':
          await this.handleCheckoutExpired(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        // Customer events
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(
            event.data.object as Stripe.Subscription
          );
          break;

        default:
          console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
      }

      processedEvents.set(event.id, true);

      if (processedEvents.size > 10000) {
        const oldestKeys = Array.from(processedEvents.keys()).slice(0, 1000);
        oldestKeys.forEach(key => processedEvents.delete(key));
      }
    } catch (error) {
      console.error(`❌ Error processing webhook event ${event.id}:`, error);
      throw error;
    }
  }

  static async createSubscriptionPlan (payload: TSubscriptionPlan) {
    // Create Stripe price first
    const stripePrice = await stripe.prices.create({
      unit_amount: payload.price * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: payload.duration
      },
      product_data: {
        name: payload.name
      }
    });

    const planData = {
      ...payload,
      stripePriceId: stripePrice.id
    };

    const result = await SubscriptionPlan.create(planData);
    return result;
  }

  static async changeSubscriptionPlan (
    contractorId: string,
    newPlanType: string,
    prorate: boolean = true
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Get current subscription
      const currentSubscription = await Subscription.findOne({
        contractorId,
        status: 'active',
        isDeleted: false
      }).session(session);

      if (!currentSubscription) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'No active subscription found'
        );
      }

      // Get new plan
      const newPlan = await SubscriptionPlan.findOne({
        type: { $in: ['basic', 'premium'] },
        isActive: true
      }).session(session);

      if (!newPlan) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'New subscription plan not found'
        );
      }

      const updatedStripeSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [
            {
              id: (
                await stripe.subscriptions.retrieve(
                  currentSubscription.stripeSubscriptionId
                )
              ).items.data[0].id,
              price: newPlan.stripePriceId
            }
          ],
          proration_behavior: prorate ? 'create_prorations' : 'none',
          metadata: {
            contractorId,
            planType: newPlanType,
            changeType: 'plan_change'
          }
        }
      );

      await Subscription.findByIdAndUpdate(
        currentSubscription._id,
        {
          planType: newPlan.type,
          endDate: new Date(updatedStripeSubscription.current_period_end * 1000)
        },
        { session }
      );

      await session.commitTransaction();

      return {
        subscription: currentSubscription,
        newPlan,
        stripeSubscription: updatedStripeSubscription,
        prorate
      };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async getAllSubscriptionPlans (query: Record<string, unknown>) {
    const planQuery = new QueryBuilder(
      SubscriptionPlan.find({ isActive: true }),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await planQuery.modelQuery;
    const meta = await planQuery.countTotal();

    return { result, meta };
  }

  static async getSingleSubscriptionPlan (id: string) {
    const result = await SubscriptionPlan.findById(id);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    return result;
  }

  static async updateSubscriptionPlan (
    id: string,
    payload: Partial<TSubscriptionPlan>
  ) {
    const result = await SubscriptionPlan.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    return result;
  }

  static async deleteSubscriptionPlan (id: string) {
    const result = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
    }
    return result;
  }

  // Helper to clean up stale pending subscriptions before a new session is started
  static async cleanUpStalePendingSubscriptions (contractorId: string) {
    const now = new Date();
    const expiryDate = new Date(now.getTime() - PENDING_EXPIRY_MINUTES * 60000);

    // Only mark as failed those pending subscriptions older than expiry date
    await Subscription.updateMany(
      {
        contractorId: new mongoose.Types.ObjectId(contractorId),
        status: 'pending',
        isDeleted: false,
        createdAt: { $lt: expiryDate } // <-- ONLY if older than expiry!
      },
      {
        $set: { status: 'failed', isDeleted: true }
      }
    );
  }

  // Helper to delete cancelled subscriptions before a new one is started
  static async deleteCancelledSubscriptions (contractorId: string) {
    // Hard delete. To soft-delete for audit/history, use updateMany and set isDeleted: true
    await Subscription.deleteMany({
      contractorId: new mongoose.Types.ObjectId(contractorId),
      status: 'cancelled'
    });
  }

  // Main function for starting a contractor Stripe subscription session
  static async createCheckoutSession (contractorId: string, planType: string) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // PART 1: PRE-CLEANUP
      await this.cleanUpStalePendingSubscriptions(contractorId);

      // Force-fail/soft-delete any remaining pending subscriptions (prevents duplicates)

      // Use the fixed cleanup function instead:
      await this.cleanUpStalePendingSubscriptions(contractorId);
      // PART 2: DELETE CANCELLED SUBS (or soft-delete as audit if desired)
      await this.deleteCancelledSubscriptions(contractorId);

      // PART 3: Proceed with normal session creation logic
      // 1. Get the plan
      const plan = await SubscriptionPlan.findOne({
        type: planType,
        isActive: true
      }).session(session);
      if (!plan)
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');

      let stripeCustomerId = null;

      // Find the contractor's user (assume you have that link)
      const contractor = await Contractor.findById(contractorId)
        .populate('userId')
        .session(session);
      if (!contractor)
        throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');

      // Check if already has one
      if (contractor.stripeCustomerId) {
        stripeCustomerId = contractor.stripeCustomerId;
      } else {
        // Or, if you store it on user:
        // if (contractor.userId.stripeCustomerId) { ... }

        // Otherwise, create in Stripe:
        const userDoc = contractor.userId as any;
        const stripeCustomer = await stripe.customers.create({
          email: userDoc.email,
          name: userDoc.fullName,
          metadata: { contractorId }
        });
        stripeCustomerId = stripeCustomer.id;

        // Optionally save it back to Contractor for reuse
        contractor.stripeCustomerId = stripeCustomerId;
        await contractor.save({ session });
      }
      // 2. Check Stripe customer, create if needed (not shown here)
      // 3. Create the new pending subscription record
      const subscription = await Subscription.create(
        [
          {
            contractorId: new mongoose.Types.ObjectId(contractorId),
            planType: plan.type,
            stripeCustomerId,
            stripeSubscriptionId: `pending_${Date.now()}_${contractorId}`,
            status: 'pending',
            startDate: new Date(),
            endDate: new Date(
              Date.now() + plan.duration * 30 * 24 * 60 * 60 * 1000
            ), // assuming duration in months
            isDeleted: false
          }
        ],
        { session }
      );
      const newPendingSubscription = subscription[0];

      // 4. Create the Stripe checkout session with proper metadata
      const checkoutSession = await stripe.checkout.sessions.create({
        // Stripe session args...
        // include: customer, line_items, mode, success_url, cancel_url, etc.
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1
          }
        ],
        subscription_data: {
          metadata: {
            contractorId,
            planType,
            pendingSubscriptionId: newPendingSubscription._id.toString()
          }
        },
        success_url: `${config.frontend_url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontend_url}/subscription/cancel`,
        metadata: {
          contractorId,
          planType,
          pendingSubscriptionId: newPendingSubscription._id.toString()
        }
      });

      await session.commitTransaction();
      return { sessionUrl: checkoutSession.url };
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async getAllSubscriptions (query: Record<string, unknown>) {
    const subscriptionQuery = new QueryBuilder(
      Subscription.find({ isDeleted: false })
        .populate('contractorId')
        .populate({
          path: 'contractorId',
          populate: { path: 'userId' }
        }),
      query
    )
      .filter()
      .sort()
      .paginate()
      .fields();

    const result = await subscriptionQuery.modelQuery;
    const meta = await subscriptionQuery.countTotal();

    return { result, meta };
  }

  static async getSingleSubscription (id: string) {
    const result = await Subscription.findById(id)
      .populate('contractorId')
      .populate({
        path: 'contractorId',
        populate: { path: 'userId' }
      });

    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
    }
    return result;
  }

  static async getSubscriptionByContractorId (contractorId: string) {
    const result = await Subscription.findOne({
      contractorId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    return result;
  }

  static async cancelSubscription (contractorId: string) {
    const subscription = await Subscription.findOne({
      contractorId,
      status: 'active',
      isDeleted: false
    });

    if (!subscription) {
      throw new AppError(httpStatus.NOT_FOUND, 'No active subscription found');
    }

    // Cancel in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update in database
    const result = await Subscription.findByIdAndUpdate(
      subscription._id,
      { status: 'cancelled' },
      { new: true }
    );

    // Update contractor
    await Contractor.findByIdAndUpdate(contractorId, {
      hasActiveSubscription: false,
      subscriptionStatus: 'cancelled'
    });

    return result;
  }

  // Webhook Handlers
  // FIXED: Proper transaction management and contractor sync

  static async handleSubscriptionCreated (
    stripeSubscription: Stripe.Subscription
  ) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Extract contractor and pendingSubscriptionId from Stripe metadata
      let contractorId = stripeSubscription.metadata?.contractorId;
      const pendingSubscriptionId =
        stripeSubscription.metadata?.pendingSubscriptionId;

      if (!contractorId) {
        // Fallback: Find by stripe customer if metadata missing
        const priorSub = await Subscription.findOne({
          stripeCustomerId: stripeSubscription.customer as string
        }).session(session);
        if (priorSub) contractorId = priorSub.contractorId.toString();
      }
      if (!contractorId)
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Contractor not found for subscription'
        );

      // Look up plan info from Stripe price
      const priceId = stripeSubscription.items.data[0].price.id;
      const plan = await SubscriptionPlan.findOne({
        stripePriceId: priceId
      }).session(session);
      if (!plan)
        throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');

      // Safely convert Stripe timestamps (UNIX seconds) to JS Dates
      const startDate = stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : new Date();
      const endDate = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null;

      if (isNaN(startDate.getTime()))
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Invalid startDate from Stripe'
        );
      if (endDate && isNaN(endDate.getTime()))
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Invalid endDate from Stripe'
        );

      // Payment method, if present
      let paymentMethodId = '';
      if (stripeSubscription.default_payment_method) {
        paymentMethodId = stripeSubscription.default_payment_method as string;
      }

      // Prepare subscription data for update/creation
      const subscriptionData = {
        contractorId: new mongoose.Types.ObjectId(contractorId),
        planType: plan.type,
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        status: SubscriptionService.mapStripeStatus(stripeSubscription.status),
        startDate,
        endDate,
        paymentMethodId,
        isDeleted: false
      };

      let subscription;
      if (pendingSubscriptionId) {
        // Update or activate the pending subscription
        subscription = await Subscription.findByIdAndUpdate(
          pendingSubscriptionId,
          subscriptionData,
          { new: true, session }
        );
      } else {
        // Upsert by Stripe subscriptionId if no pending ID
        subscription = await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: stripeSubscription.id },
          subscriptionData,
          { upsert: true, new: true, session }
        );
      }

      // Update contractor data to stay in sync
      const contractorUpdate = {
        subscriptionId: subscription?._id,
        hasActiveSubscription: stripeSubscription.status === 'active',
        subscriptionStatus: SubscriptionService.mapStripeStatus(
          stripeSubscription.status
        ),
        paymentMethodId,
        stripeCustomerId: stripeSubscription.customer as string
      };

      const updatedContractor = await Contractor.findByIdAndUpdate(
        contractorId,
        contractorUpdate,
        { new: true, session }
      );
      if (!updatedContractor)
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Contractor not found for update'
        );

      await session.commitTransaction();
      console.log(
        '✅ Subscription and contractor updated successfully:',
        contractorId
      );
      return subscription;
    } catch (error) {
      console.error('❌ Error in handleSubscriptionCreated:', error);
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Subscription updated // FIXED: Ensure contractor field updates
  static async handleSubscriptionUpdated (
    stripeSubscription: Stripe.Subscription
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id
      }).session(session);

      if (!subscription) {
        console.log('⚠️ Subscription not found, creating new one');
        return this.handleSubscriptionCreated(stripeSubscription);
      }

      const updatedStatus = this.mapStripeStatus(stripeSubscription.status);
      const startDate = new Date(
        stripeSubscription.current_period_start * 1000
      );
      const endDate = new Date(stripeSubscription.current_period_end * 1000);

      // Update subscription
      await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          status: updatedStatus,
          startDate,
          endDate
        },
        { session }
      );

      // CRITICAL: Update contractor in same transaction
      await Contractor.findByIdAndUpdate(
        subscription.contractorId,
        {
          hasActiveSubscription: stripeSubscription.status === 'active',
          subscriptionStatus: updatedStatus
        },
        { session }
      );

      await session.commitTransaction();

      console.log(
        `✅ Subscription updated for contractor: ${subscription.contractorId}`
      );
    } catch (error) {
      console.error('❌ Error in handleSubscriptionUpdated:', error);
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }
  // Subscription deleted/cancelled
  static async handleSubscriptionDeleted (
    stripeSubscription: Stripe.Subscription
  ) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id
      }).session(session);

      if (!subscription) {
        console.log('⚠️ Subscription not found for deletion');
        return;
      }

      // Update subscription status
      await Subscription.findByIdAndUpdate(
        subscription._id,
        { status: 'cancelled' },
        { session }
      );

      // CRITICAL: Update contractor in same transaction
      await Contractor.findByIdAndUpdate(
        subscription.contractorId,
        {
          hasActiveSubscription: false,
          subscriptionStatus: 'cancelled'
        },
        { session }
      );

      await session.commitTransaction();

      console.log(
        `✅ Subscription cancelled for contractor: ${subscription.contractorId}`
      );
    } catch (error) {
      console.error('❌ Error in handleSubscriptionDeleted:', error);
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Invoice payment succeeded
  static async handleInvoicePaymentSucceeded (invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );

    // Update subscription dates based on successful payment
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription as string
    });

    if (subscription) {
      const updateData = {
        status: 'active' as const,
        startDate: new Date(stripeSubscription.current_period_start * 1000),
        endDate: new Date(stripeSubscription.current_period_end * 1000)
      };

      await Subscription.findByIdAndUpdate(subscription._id, updateData);

      await Contractor.findByIdAndUpdate(subscription.contractorId, {
        hasActiveSubscription: true,
        subscriptionStatus: 'active'
      });
    }
  }

  // Invoice payment failed
  static async handleInvoicePaymentFailed (invoice: Stripe.Invoice) {
    console.log(`💳❌ Processing payment failed: ${invoice.id}`);

    if (!invoice.subscription) return;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription as string
    });

    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'failed'
      });

      await Contractor.findByIdAndUpdate(subscription.contractorId, {
        hasActiveSubscription: false,
        subscriptionStatus: 'failed'
      });

      console.log(
        `❌ Payment failed for contractor: ${subscription.contractorId}`
      );

      // TODO: Send payment failure notification
    }
  }

  // Invoice upcoming (7 days before renewal)
  static async handleInvoiceUpcoming (invoice: Stripe.Invoice) {
    console.log(`📅 Processing upcoming invoice: ${invoice.id}`);

    if (!invoice.subscription) return;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription as string
    }).populate({
      path: 'contractorId',
      populate: { path: 'userId' }
    });

    if (subscription) {
      console.log(
        `📧 Sending renewal reminder to contractor: ${subscription.contractorId}`
      );

      // TODO: Send renewal reminder email
      // EmailService.sendRenewalReminder(subscription);
    }
  }

  // Checkout completed
  static async handleCheckoutCompleted (session: Stripe.Checkout.Session) {
    console.log(`✅ Processing checkout completed: ${session.id}`);

    if (session.mode === 'subscription' && session.subscription) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await this.handleSubscriptionCreated(stripeSubscription);
    }
  }

  // Checkout expired
  static async handleCheckoutExpired (session: Stripe.Checkout.Session) {
    console.log(`⏰ Checkout session expired: ${session.id}`);

    // TODO: Log analytics or send follow-up email
  }

  // Trial will end
  static async handleTrialWillEnd (stripeSubscription: Stripe.Subscription) {
    console.log(`⏰ Trial ending soon: ${stripeSubscription.id}`);

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    }).populate({
      path: 'contractorId',
      populate: { path: 'userId' }
    });

    if (subscription) {
      console.log(
        `📧 Sending trial ending reminder to contractor: ${subscription.contractorId}`
      );

      // TODO: Send trial ending email
      // EmailService.sendTrialEndingReminder(subscription);
    }
    // Helper: Map Stripe status to internal status
  }

  static mapStripeStatus (
    stripeStatus: string
  ):
    | 'active'
    | 'inactive'
    | 'cancelled'
    | 'expired'
    | 'failed'
    | 'pending'
    | 'processing' {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
      case 'cancelled':
        return 'cancelled';
      case 'incomplete':
      case 'incomplete_expired':
        return 'failed';
      case 'past_due':
        return 'failed';
      case 'unpaid':
        return 'failed';
      case 'trialing':
        return 'active';
      default:
        return 'inactive';
    }
  }

  static async updateSubscriptionStatusFromStripe (
    stripeSubscription: Stripe.Subscription
  ) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const stripeSubId = stripeSubscription.id;
      const statusMapped = SubscriptionService.mapStripeStatus(
        stripeSubscription.status
      );

      // Parse dates safely as before
      const startDate = stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : new Date();
      const endDate = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null;

      // Update or create the subscription record
      const updated = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: stripeSubId },
        {
          startDate,
          endDate,
          status: statusMapped
          // ...other fields you want to sync (e.g. paymentMethodId, stripeCustomerId)
        },
        { new: true, upsert: true, session }
      );

      await session.commitTransaction();
      return updated;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async handleSubscriptionCancelled (
    stripeSubscription: Stripe.Subscription
  ) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'cancelled'
      });

      await Contractor.findByIdAndUpdate(subscription.contractorId, {
        hasActiveSubscription: false,
        subscriptionStatus: 'cancelled'
      });
    }
  }

  static async handlePaymentFailed (stripeInvoice: Stripe.Invoice) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeInvoice.subscription as string
    });

    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'failed'
      });

      await Contractor.findByIdAndUpdate(subscription.contractorId, {
        hasActiveSubscription: false,
        subscriptionStatus: 'failed'
      });
    }
  }

  static async hasActiveSubscription (contractorId: string): Promise<boolean> {
    const subscription = await Subscription.findOne({
      contractorId,
      status: { $in: ['active', 'pending', 'processing'] },
      endDate: { $gt: new Date() },
      isDeleted: false
    });

    return !!subscription;
  }

  // Helper function to safely convert timestamps
  static convertTimestampToDate (ts: number) {
    if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
      const date = new Date(ts * 1000);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    console.warn(`Invalid timestamp received: ${ts}, using current date`);
    return new Date();
  }

  static validateAndConvertDate (timestamp: number | undefined | null): Date {
    if (!timestamp || typeof timestamp !== 'number' || timestamp <= 0) {
      console.warn(`Invalid timestamp: ${timestamp}, using current date`);
      return new Date();
    }
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date conversion for timestamp: ${timestamp}`);
      return new Date();
    }
    return date;
  }

  /***
   *=====================================================================
   * ADMIN
   * =================================================================
   */

  static async getRevenueSummary (dateRange?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const matchStage: any = {
      isDeleted: false,
      status: { $in: ['active', 'expired', 'cancelled'] } // Only count paid subscriptions
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      matchStage.createdAt = {};
      if (dateRange.startDate) {
        matchStage.createdAt.$gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        matchStage.createdAt.$lte = dateRange.endDate;
      }
    }

    const [revenueSummary] = await Subscription.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: ['$planDetails.price', '$planDetails.duration']
            }
          },
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expiredSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          cancelledSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          activeRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'active'] },
                { $multiply: ['$planDetails.price', '$planDetails.duration'] },
                0
              ]
            }
          },
          averageRevenuePerUser: {
            $avg: {
              $multiply: ['$planDetails.price', '$planDetails.duration']
            }
          }
        }
      }
    ]);

    // Calculate Monthly Recurring Revenue (MRR) - normalized to monthly
    const [mrrData] = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          isDeleted: false,
          endDate: { $gt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: null,
          currentMRR: {
            $sum: {
              $divide: [
                { $multiply: ['$planDetails.price', '$planDetails.duration'] },
                '$planDetails.duration' // Normalize to monthly
              ]
            }
          },
          activePlans: { $sum: 1 }
        }
      }
    ]);

    return {
      totalRevenue: revenueSummary?.totalRevenue || 0,
      totalSubscriptions: revenueSummary?.totalSubscriptions || 0,
      activeSubscriptions: revenueSummary?.activeSubscriptions || 0,
      expiredSubscriptions: revenueSummary?.expiredSubscriptions || 0,
      cancelledSubscriptions: revenueSummary?.cancelledSubscriptions || 0,
      activeRevenue: revenueSummary?.activeRevenue || 0,
      averageRevenuePerUser:
        Math.round((revenueSummary?.averageRevenuePerUser || 0) * 100) / 100,
      monthlyRecurringRevenue:
        Math.round((mrrData?.currentMRR || 0) * 100) / 100,
      activePlans: mrrData?.activePlans || 0,
      conversionRate: revenueSummary?.totalSubscriptions
        ? Math.round(
            (revenueSummary.activeSubscriptions /
              revenueSummary.totalSubscriptions) *
              100 *
              100
          ) / 100
        : 0
    };
  }

  // Get monthly revenue breakdown
  static async getMonthlyRevenue (year?: number) {
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1); // January 1st
    const endDate = new Date(targetYear + 1, 0, 1); // January 1st next year

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: { $in: ['active', 'expired', 'cancelled'] },
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: { $month: '$createdAt' },
          monthlyRevenue: {
            $sum: {
              $multiply: ['$planDetails.price', '$planDetails.duration']
            }
          },
          subscriptionCount: { $sum: 1 },
          uniqueContractors: { $addToSet: '$contractorId' }
        }
      },
      {
        $project: {
          month: '$_id',
          revenue: '$monthlyRevenue',
          subscriptions: '$subscriptionCount',
          uniqueContractors: { $size: '$uniqueContractors' },
          averageOrderValue: {
            $divide: ['$monthlyRevenue', '$subscriptionCount']
          }
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Fill missing months with zero values
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const completeMonthlyData = monthNames.map((monthName, index) => {
      const monthData = monthlyRevenue.find(item => item.month === index + 1);
      return {
        month: index + 1,
        monthName,
        revenue: monthData?.revenue || 0,
        subscriptions: monthData?.subscriptions || 0,
        uniqueContractors: monthData?.uniqueContractors || 0,
        averageOrderValue:
          Math.round((monthData?.averageOrderValue || 0) * 100) / 100
      };
    });

    // Calculate growth rates
    const monthlyGrowth = completeMonthlyData.map((current, index) => {
      if (index === 0) return { ...current, growthRate: 0 };

      const previous = completeMonthlyData[index - 1];
      const growthRate =
        previous.revenue === 0
          ? current.revenue > 0
            ? 100
            : 0
          : Math.round(
              ((current.revenue - previous.revenue) / previous.revenue) *
                100 *
                100
            ) / 100;

      return { ...current, growthRate };
    });

    const totalYearRevenue = completeMonthlyData.reduce(
      (sum, month) => sum + month.revenue,
      0
    );
    const totalYearSubscriptions = completeMonthlyData.reduce(
      (sum, month) => sum + month.subscriptions,
      0
    );

    return {
      year: targetYear,
      monthlyBreakdown: monthlyGrowth,
      yearTotal: {
        revenue: totalYearRevenue,
        subscriptions: totalYearSubscriptions,
        averageMonthlyRevenue: Math.round((totalYearRevenue / 12) * 100) / 100
      }
    };
  }

  // Get revenue breakdown by subscription plan
  static async getRevenueByPlan (dateRange?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const matchStage: any = {
      isDeleted: false,
      status: { $in: ['active', 'expired', 'cancelled'] }
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      matchStage.createdAt = {};
      if (dateRange.startDate) {
        matchStage.createdAt.$gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        matchStage.createdAt.$lte = dateRange.endDate;
      }
    }

    const planRevenue = await Subscription.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: '$planType',
          totalRevenue: {
            $sum: {
              $multiply: ['$planDetails.price', '$planDetails.duration']
            }
          },
          subscriptionCount: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          averagePrice: { $avg: '$planDetails.price' },
          planDetails: { $first: '$planDetails' }
        }
      },
      {
        $project: {
          planType: '$_id',
          totalRevenue: 1,
          subscriptionCount: 1,
          activeCount: 1,
          averageOrderValue: {
            $divide: ['$totalRevenue', '$subscriptionCount']
          },
          planPrice: '$planDetails.price',
          planDuration: '$planDetails.duration',
          planFeatures: '$planDetails.features'
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const totalRevenue = planRevenue.reduce(
      (sum, plan) => sum + plan.totalRevenue,
      0
    );

    const planBreakdown = planRevenue.map(plan => ({
      ...plan,
      revenuePercentage:
        totalRevenue > 0
          ? Math.round((plan.totalRevenue / totalRevenue) * 100 * 100) / 100
          : 0,
      averageOrderValue: Math.round(plan.averageOrderValue * 100) / 100
    }));

    return {
      totalRevenue,
      planBreakdown,
      mostPopularPlan: planRevenue[0]?.planType || null,
      highestRevenuePlan:
        planRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
          ?.planType || null
    };
  }

  // Get MRR analytics and growth trends
  static async getMRRAnalytics () {
    // Current MRR
    const [currentMRR] = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          isDeleted: false,
          endDate: { $gt: new Date() }
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: null,
          currentMRR: {
            $sum: {
              $divide: [
                { $multiply: ['$planDetails.price', '$planDetails.duration'] },
                '$planDetails.duration'
              ]
            }
          },
          activeSubscriptions: { $sum: 1 }
        }
      }
    ]);

    // MRR trend over last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const mrrTrend = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ['active', 'expired', 'cancelled'] },
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newMRR: {
            $sum: {
              $divide: [
                { $multiply: ['$planDetails.price', '$planDetails.duration'] },
                '$planDetails.duration'
              ]
            }
          },
          newSubscriptions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Calculate churn rate and expansion revenue
    const [churnData] = await Subscription.aggregate([
      {
        $match: {
          status: 'cancelled',
          isDeleted: false,
          updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: null,
          churnedMRR: {
            $sum: {
              $divide: [
                { $multiply: ['$planDetails.price', '$planDetails.duration'] },
                '$planDetails.duration'
              ]
            }
          },
          churnedSubscriptions: { $sum: 1 }
        }
      }
    ]);

    const currentMRRValue = currentMRR?.currentMRR || 0;
    const churnedMRRValue = churnData?.churnedMRR || 0;
    const churnRate =
      currentMRRValue > 0 ? (churnedMRRValue / currentMRRValue) * 100 : 0;

    return {
      currentMRR: Math.round(currentMRRValue * 100) / 100,
      activeSubscriptions: currentMRR?.activeSubscriptions || 0,
      averageRevenuePerUser:
        currentMRR?.activeSubscriptions > 0
          ? Math.round(
              (currentMRRValue / currentMRR.activeSubscriptions) * 100
            ) / 100
          : 0,
      monthlyChurnRate: Math.round(churnRate * 100) / 100,
      churnedMRR: Math.round(churnedMRRValue * 100) / 100,
      churnedSubscriptions: churnData?.churnedSubscriptions || 0,
      mrrTrend: mrrTrend.map(item => ({
        year: item._id.year,
        month: item._id.month,
        newMRR: Math.round(item.newMRR * 100) / 100,
        newSubscriptions: item.newSubscriptions
      }))
    };
  }

  // Get revenue trends and forecasting
  static async getRevenueTrends (months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const trends = await Subscription.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['active', 'expired', 'cancelled'] },
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planType',
          foreignField: 'type',
          as: 'planDetails'
        }
      },
      { $unwind: '$planDetails' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          weeklyRevenue: {
            $sum: {
              $multiply: ['$planDetails.price', '$planDetails.duration']
            }
          },
          weeklySubscriptions: { $sum: 1 },
          uniqueContractors: { $addToSet: '$contractorId' }
        }
      },
      {
        $group: {
          _id: { year: '$_id.year', month: '$_id.month' },
          monthlyRevenue: { $sum: '$weeklyRevenue' },
          monthlySubscriptions: { $sum: '$weeklySubscriptions' },
          averageWeeklyRevenue: { $avg: '$weeklyRevenue' },
          weeklyData: {
            $push: {
              week: '$_id.week',
              revenue: '$weeklyRevenue',
              subscriptions: '$weeklySubscriptions',
              uniqueContractors: { $size: '$uniqueContractors' }
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Simple revenue forecasting based on trend
    let forecast = null;
    if (trends.length >= 3) {
      const recentTrends = trends.slice(-3);
      const avgGrowth =
        recentTrends.reduce((sum, trend, index) => {
          if (index === 0) return 0;
          const prevRevenue = recentTrends[index - 1].monthlyRevenue;
          return sum + (trend.monthlyRevenue - prevRevenue) / prevRevenue;
        }, 0) /
        (recentTrends.length - 1);

      const lastMonthRevenue = trends[trends.length - 1]?.monthlyRevenue || 0;
      forecast = {
        nextMonthProjection:
          Math.round(lastMonthRevenue * (1 + avgGrowth) * 100) / 100,
        growthRate: Math.round(avgGrowth * 100 * 100) / 100,
        confidence:
          trends.length >= 6 ? 'High' : trends.length >= 3 ? 'Medium' : 'Low'
      };
    }

    return {
      trends: trends.map(trend => ({
        year: trend._id.year,
        month: trend._id.month,
        monthlyRevenue: trend.monthlyRevenue,
        monthlySubscriptions: trend.monthlySubscriptions,
        averageWeeklyRevenue:
          Math.round(trend.averageWeeklyRevenue * 100) / 100,
        weeklyBreakdown: trend.weeklyData
      })),
      forecast,
      totalPeriodRevenue: trends.reduce(
        (sum, trend) => sum + trend.monthlyRevenue,
        0
      ),
      averageMonthlyRevenue:
        trends.length > 0
          ? Math.round(
              (trends.reduce((sum, trend) => sum + trend.monthlyRevenue, 0) /
                trends.length) *
                100
            ) / 100
          : 0
    };
  }
}
