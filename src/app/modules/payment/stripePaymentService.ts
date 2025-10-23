/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { User } from '../User/user.model';
import { Booking } from '../Booking/Booking.model';
import { Plans } from '../Subscription/Subscription.model';
import { Withdraw } from './stripe.model';
import { Contractor } from '../Contractor/Contractor.model';
const stripe = new Stripe(config.stripe_secret_key as string);

const createStripeSubscriptionSessionIntoDB = async (user: any, paymentData: any) => {
  const email = user?.userEmail;
  const { planId } = paymentData;

  const plan = await Plans.findById(planId);
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");

  const userData = await User.findOne({ email });
  if (!userData?.contractor) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const metadata = {
    payUser: userData.contractor.toString(),
    subscriptionId: plan._id.toString(),
    type: "subscription",
    amount: String(plan.price),
  };

  const product = await stripe.products.create({
    name: `${plan.planType.toUpperCase()} Plan (${plan.duration})`,
    description: `Includes: ${plan.details?.join(", ") || "Standard features"}`,
  });

  const interval = plan.duration === "Yearly" ? "year" : "month";

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(Number(plan.price) * 100),
    currency: "aud",
    recurring: { interval },
  });

  let customer;
  const existingCustomers = await stripe.customers.list({ email, limit: 1 });
  if (existingCustomers.data.length > 0) {
    customer = existingCustomers.data[0];
  } else {
    customer = await stripe.customers.create({
      email,
      metadata,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: price.id, quantity: 1 }],
    metadata,
    subscription_data: { metadata },

    success_url: `${config.frontend_url}/payments/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/payments/subscription/cancel`,
  });

  return session.url as string;
};

const createStripeCheckoutSessionIntoDB = async (user: any, paymentData: any): Promise<string> => {
  const email = user?.userEmail;
  const { amount = 50, bookingId } = paymentData;

  // Validate booking
  const booking = await Booking.findOne({ bookingId }).populate(
    'contractorId',
    'fullName img'
  );

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Validate user
  const userData = await User.findOne({ email });
  if (!userData) {
    throw new Error('User not found');
  }

  console.log('userData._id', userData._id)

  // @ts-ignore
  const contractorName = booking?.contractorId?.fullName || 'Contractor';
  // @ts-ignore
  const contractorImg = booking?.contractorId?.img ? [booking.contractorId.img] : [];

  const metadata = {
    payUser: userData._id.toString(),
    bookingId,
    type: 'booking_payment',
    amount: String(amount),
  };

  const session = await stripe.checkout.sessions.create({
    // @ts-ignore
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${config.frontend_url}/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/cancel`,
    customer_email: email,
    metadata,
    payment_intent_data: {
      metadata,
    },
    line_items: [
      {
        price_data: {
          currency: 'aud',
          unit_amount: Math.round(Number(amount) * 100),
          product_data: {
            name: `Payment for ${contractorName}`,
            images: contractorImg,
            description: `Booking ID: ${bookingId}`,
          },
        },
        quantity: 1,
      },
    ],
  });

  return session.url as string;
};

const confirmStripePaymentIntoDB = async (paymentIntentId: string) => {
  const confirmedPaymentIntent =
    await stripe.paymentIntents.confirm(paymentIntentId);

  return confirmedPaymentIntent;
};

const checkAccountStatusIntoDB = async (id: any) => {
  const actor = await User.findById(id).populate('contractor');
  const stripeAccountId = actor?.stripeAccountId
  // const stripeAccountId = actor?.stripeAccountId
  // Check if bank information is now complete
  const account = await stripe.accounts.retrieve(stripeAccountId as string);
  // const account = await stripe.accounts.retrieve(actor?.stripeAccountId as string);
  if (!account?.requirements?.currently_due?.includes("external_account")) {
    // Bank info is complete, trigger transfer process
    // const transactions = await Transaction.findOne({ actorId:actor?._id });
    // const transactions = await Transaction.findOne({ actorId: actor?._id, paymentStatus: 'pending' });
    // const competetionResult = await CompetitionResult.findOne({ _id: transactions?.competitionId });
    // if (transactions?.adminPermission == 'approved') {

    //   const result = await withdrawalProcessPaymentIntoDB(transactions, stripeAccountId as string);
    //   if (result) {
    //     transactions.paymentStatus = 'completed';
    //     await transactions.save();


    //     if (competetionResult) {
    //       competetionResult.withdrawalStatus = 'received';
    //       await competetionResult.save();
    //     }
    //   }
    //   return result;



    // } else {
    //   return { message: "Admin permission is pending" };
    // }
  } else {

    let accountLink = null;

    // Create an account link for Stripe onboarding if the actor has a Stripe account ID
    if (actor && actor.stripeAccountId) {
      accountLink = await stripe.accountLinks.create({
        account: actor.stripeAccountId,
        refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
        return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
        type: 'account_onboarding',
      });
    } else {

      const account = await stripe.accounts.create({
        type: 'express',
        email: actor?.email,
      });

      // Assign the Stripe account ID to the actor and save it
      if (actor && account.id) {
        actor.stripeAccountId = account.id;
        await actor.save(); // Ensure save is part of the transaction
      }
      accountLink = await stripe.accountLinks.create({
        account: actor?.stripeAccountId as any,
        refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
        return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
        type: 'account_onboarding',
      });
      // let accountLink = null;

      // // Create an account link for Stripe onboarding if the actor has a Stripe account ID
      // if (actor && actor.stripeAccountId) {

      // }

      // Commit transaction if everything went well
      // return { url: accountLink?.url };


    }
    return { url: accountLink?.url };


    // return { message: "Bank information still incomplete" };
  }

};

const withdrawalBalanceProcess = async (amount: number, email: string) => {
  try {
    if (!amount || amount <= 0) throw new Error('Invalid withdrawal amount.');
    if (!email) throw new Error('User email is required.');

    const user = await User.findOne({ email }) as any;
    if (!user || user.role !== 'contractor') throw new Error('User not found.');
    const contractor = await Contractor.findOne({ _id: user.contractor }) as any;
    if (!contractor) throw new Error('Contractor profile not found.');

    let stripeAccountId = user.stripeAccountId;

    // ✅ Step 1: Create account if not exists
    if (!stripeAccountId) {
      console.log('==========================================================================================:', user.email);
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'AU',
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
      });

      console.log('✅ Created new Stripe account:', account.id);
      await User.findByIdAndUpdate(user._id, { stripeAccountId: account.id });
      stripeAccountId = account.id;
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (account.details_submitted === false) {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: 'https://yourapp.com/reauth',
        return_url: 'https://yourapp.com/complete',
        type: 'account_onboarding',
      });
      return { success: true, url: accountLink.url };
    }

    if (user.balance < amount) {
      throw new Error('Insufficient balance.');
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'aud',
      destination: stripeAccountId,
      description: `Withdrawal for ${user.email}`,
    });

    console.log('✅ Transfer successful:', transfer.id);

    await Contractor.findByIdAndUpdate(contractor._id, { $inc: { balance: -amount } });

    const withdrawal = await Withdraw.create({
      userId: user._id,
      payoutId: transfer.id,
      amount,
      date: new Date(),
      status: 'received',
    });

    return {
      success: true,
      message: 'Withdrawal successful.',
      transferId: transfer.id,
      withdrawalId: withdrawal._id,
    };

  } catch (error: any) {
    console.error('❌ Withdrawal process failed:', error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};

const getWithdrawalList = async (
  userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  }
) => {

  const { page = 1, limit = 10, status } = query;

  const filter: any = { userId };
  if (status) {
    filter.status = status;
  } else {
    filter.status = 'received';
  }

  const skip = (page - 1) * limit;

  const withdrawals = await Withdraw.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdraw.countDocuments(filter);

  return {
    total,
    page,
    limit,
    withdrawals,
  };
};


const getWithdrawalListAdmin = async (query: {
  page?: number;
  limit?: number;
  status?: string;
}
) => {

  const { page = 1, limit = 10, status } = query;

  const filter: any = {};
  if (status) {
    filter.status = status;
  } else {
    filter.status = 'received';
  }

  const skip = (page - 1) * limit;

  const withdrawals = await Withdraw.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdraw.countDocuments(filter);

  return {
    total,
    page,
    limit,
    withdrawals,
  };
};

export const PaymentServices = {
  getWithdrawalListAdmin,
  getWithdrawalList,
  withdrawalBalanceProcess,
  confirmStripePaymentIntoDB,
  checkAccountStatusIntoDB,
  createStripeCheckoutSessionIntoDB,
  createStripeSubscriptionSessionIntoDB
};


// const addMany = await Withdraw.insertMany([
//   {
//     userId: "68f8745e960c89cde4f77875",
//     payoutId: "po_1R2X9Zb9L0PQ67890GhIjKl",
//     amount: 500.0,
//     date: new Date("2025-10-18T14:25:00.000Z"),
//     status: "received",
//   },
//   {
//     userId: "68f8745e960c89cde4f77875",
//     payoutId: "po_1R2XaYb9L0PQ99999MnOpQr",
//     amount: 120.5,
//     date: new Date("2025-10-15T11:45:00.000Z"),
//     status: "rejected",
//   },
//   {
//     userId: "68f8745e960c89cde4f77875",
//     payoutId: "po_1R2XbZb9L0PQ33333StUvWx",
//     amount: 900.0,
//     date: new Date("2025-10-12T17:30:00.000Z"),
//     status: "received",
//   },
// ]);