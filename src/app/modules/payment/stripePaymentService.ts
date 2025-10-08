/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Stripe from 'stripe';

import config from '../../config';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { User } from '../User/user.model';
import mongoose from 'mongoose';
import { Transaction } from '../Transaction/transaction.model';
import { Contractor } from '../Contractor/Contractor.model';
import { Booking } from '../Booking/Booking.model';
/* eslint-disable @typescript-eslint/no-explicit-any */
const stripe = new Stripe(config.stripe_secret_key as string);

const createSingleStripePaymentIntoDB = async (
  user: any,
  paymentData: any,
): Promise<string> => {
  const { competitionId } = paymentData;
  console.log('paymentData', paymentData)

  let actor = null;


  if (user.role === 'customer') {
    actor = await User.findOne({ email: user.userEmail });
  } else {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorized');
  }

  if (!actor) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You are not authorized');
  }
  // const entryFeeInDollars = parseFloat(competition.entryFee); // Ensure the value is a number in USD
  // const entryFeeInCents = Math.round(entryFeeInDollars * 100); // Convert USD to cents

  const metadata: Stripe.MetadataParam = {
    competitionId,
    actorId: actor?._id as any,
  };


  const paymentIntent = await stripe.paymentIntents.create({
    amount: 500,
    // amount: entryFeeInCents,
    currency: 'usd',
    payment_method_types: ['card'],
    metadata,
    description: 'Competition Entry Fee',
  });



  return paymentIntent.client_secret as string;


}

const createStripeCheckoutSessionIntoDB = async (
  user: any,
  paymentData: any,
): Promise<string> => {

  console.log('user', user);

  const email = user?.email || 'ahmadmusa9805@gmail.com';

  const { serviceId = 'ahmadmusa', amount = 50, currency = 'USD', bookingId } = paymentData;

  // Fetch the booking and populate contractor details
  const booking = await Booking.findOne({ bookingId }).populate('contractorId fullName img');

  // @ts-ignore
  const contractorName = booking?.contractorId?.fullName || 'Contractor';
  // @ts-ignore
  const contractorImg = booking?.contractorId?.img ? [booking.contractorId.img] : [];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${config.frontend_url}/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.frontend_url}/cancel`,
    customer_email: `${email}`,
    metadata: {
      payUser: `${user.fullName}`,
      bookingId,
    },
    line_items: [
      {
        price_data: {
          currency: currency,
          unit_amount: Math.round(Number(amount) * 100), // Stripe expects amount in cents
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
}


const verifyStripeSessionIntoDB = async (sessionId: any) => {

  console.log('sessionId', sessionId)

  if (!sessionId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'sessionId is required');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    //payment_status = "no_payment_required", "paid", "unpaid"
    if (session.payment_status !== "paid") {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment Failled");
    }

    const metadata = session?.metadata;
    if (!metadata) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid Session Id");
    }



    //update database base on metadata = session.metadata
    // const result = await OrderModel.updateOne({
    //   _id: metadata.orderId,
    //   userId: metadata.userId
    // }, {
    //   paymentStatus: "paid"
    // })

    return 'payment successfully';
  } catch (err: any) {
    throw new Error(err)
  }
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

const checkBankStatusAndTransferIntoDB = async (id: any) => {
  const userData = await User.findById(id).populate('contractor');
  const stripeAccountId = userData?.stripeAccountId
  // Check if bank information is now complete

  const account = await stripe.accounts.retrieve(stripeAccountId as string);
  // const account = await stripe.accounts.retrieve(actor?.stripeAccountId as string);

  if (!account?.requirements?.currently_due?.includes("external_account")) {
    // Bank info is complete, trigger transfer process
    // const transactionData = await Transaction.findOne({ userId:userData?._id });
    const transactionData = await Transaction.findOne({ userId: userData?._id, paymentStatus: 'pending' });
    // const competetionResult = await CompetitionResult.findOne({ _id: transactions?.competitionId });

    const result = await withdrawalProcessPaymentIntoDB(transactionData?.amount, stripeAccountId as string);
    if (result && transactionData) {
      transactionData.paymentStatus = 'paid';
      await transactionData.save();
    }
    return result;
  } else {
    let accountLink = null;

    // Create an account link for Stripe onboarding if the actor has a Stripe account ID
    if (userData && userData?.stripeAccountId) {
      accountLink = await stripe.accountLinks.create({
        account: userData.stripeAccountId,
        refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
        return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`,
        type: 'account_onboarding',
      });
    } else {

      const account = await stripe.accounts.create({
        type: 'express',
        email: userData?.email,
      });

      // Assign the Stripe account ID to the actor and save it
      if (userData && account.id) {
        userData.stripeAccountId = account.id;
        await userData.save(); // Ensure save is part of the transaction
      }
      accountLink = await stripe.accountLinks.create({
        account: userData?.stripeAccountId as any,
        refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
        return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`,
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
}

const withdrawalProcessPaymentIntoDB = async (amount: any, stripeAccountId: string) => {
  const transfer = await stripe.transfers.create({
    amount: amount,
    currency: 'usd',
    destination: stripeAccountId,
    description: 'Transfer to contractor',
  });
  return transfer;
};

const checkPaymentCompletefromDB = async (user: any, payload: any) => {

  let actor = null;

  // if (user.role === 'actor') {
  //   actor = await Actor.findOne({ email: user.userEmail });
  // }

  // const existingTransaction = await Transaction.findOne({ competitionId: payload.competitionId, actorId: actor?._id, paymentStatus: 'completed' });
  // return existingTransaction
};
const webhookToService = async (data: any, headers: any) => {
  const event = stripe.webhooks.constructEvent(
    data,
    headers['stripe-signature'],
    config.stripe_webhook_secret ?? ''
  );


  if (event.type === 'account.updated') {
    const account = event.data.object;

    if (account.charges_enabled) {
      // const actor = await Actor.findOne({ stripeAccountId: account.id });
      // if (actor) {
      //   await Transaction.updateMany(
      //     { actorId: actor._id, type: 'withdrawal', status: 'pending' },
      //     { status: 'ready' }
      //   );
      // }
    }
  }

  return 'Webhook received.';
};

const singleWithdrawalProcessIntoDB = async (
  payload: any,
  user: any,
) => {
  let userData = null;

  if (user?.role === 'contractor') {
    userData = await User.findOne({ email: user.userEmail }).populate('contractor');
  }
  let newTransaction;
  const transactionData = {
    userId: userData?._id,
    type: 'withdraw',
    amount: payload?.amount,
  };
  // const session = await mongoose.startSession();
  // try {
  // session.startTransaction();

  newTransaction = await Transaction.create(transactionData);

  if (!newTransaction) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Transaction');
  }

  // Check if the actor has a Stripe account ID, create one if they don’t
  if (!userData?.stripeAccountId) {

    const account = await stripe.accounts.create({
      type: 'express',
      email: userData?.email,
    });

    // Assign the Stripe account ID to the actor and save it
    if (userData) {

      userData.stripeAccountId = account.id;

      // Handle encryption or hashing if required (e.g., for password or sensitive fields)
      try {
        // await userData.save(); // Ensure save is part of the transaction
        // await User.updateOne({ stripeAccountId: account.id });
        await User.findByIdAndUpdate(userData._id, { stripeAccountId: account.id }, {
          new: true,
          runValidators: true
        }).select('-password');
        console.log('userData updated successfully', userData);
      } catch (error) {
        console.error('Error saving user data:', error);
        // Handle error, such as validation issues or encryption problems
        throw new Error('Error saving user data.');
      }
      // await userData.save(); // Ensure save is part of the transaction
      // await userData.save({ session }); // Ensure save is part of the transaction
      console.log('userData ahmad', userData)
    }

    let accountLink = null;
    console.log('userData.stripeAccountId', userData?.stripeAccountId)
    // // Create an account link for Stripe onboarding if the actor has a Stripe account ID
    // if (userData && userData.stripeAccountId) {
    console.log('user 388', userData?.stripeAccountId)
    accountLink = await stripe.accountLinks.create({
      account: userData?.stripeAccountId as string,
      refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
      return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`, // Include actorId here
      type: 'account_onboarding',
    });
    // }

    // Commit transaction if everything went well
    // await session.commitTransaction();
    return { url: accountLink?.url };
  }


  const stripeAccountId = userData?.stripeAccountId
  const account = await stripe.accounts.retrieve(stripeAccountId as string);


  if (account?.requirements?.currently_due?.includes("external_account")) {

    // Bank info is not complete, trigger to generate onboarding link
    let accountLink = null;

    // Create an account link for Stripe onboarding if the actor has a Stripe account ID
    if (userData && userData.stripeAccountId) {
      accountLink = await stripe.accountLinks.create({
        account: userData.stripeAccountId,
        refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
        return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`, // Include actorId here
        type: 'account_onboarding',
      });
    }
    // await session.commitTransaction();
    return { url: accountLink?.url };
  }


  // const result = await withdrawalProcessPaymentIntoDB(newTransaction?.amount, user?.stripeAccountId as string);
  const transfer = await stripe.transfers.create({
    amount: newTransaction?.amount,
    currency: 'usd',
    destination: stripeAccountId,
    description: 'Transfer to contractor',
  });
  // return transfer;


  if (transfer && newTransaction) {

    newTransaction.paymentStatus = 'paid';
    await newTransaction.save();
    const contractorData = await Contractor.findOne({ userId: userData?._id });

    if (contractorData) {
      contractorData.balance = Number(contractorData.balance) - transfer.amount;
      await contractorData.save();
    }



  }

  return transfer;

  // } catch (err: any) {
  //   // Rollback transaction on error
  //   // await session.abortTransaction();
  //   throw new Error(err.message); // Re-throw error to handle it outside if needed
  // } finally {
  //   // End the session
  //   // await session.endSession();
  // }
};

export const PaymentServices = {
  checkPaymentCompletefromDB,
  webhookToService,
  withdrawalProcessPaymentIntoDB,
  createSingleStripePaymentIntoDB,
  confirmStripePaymentIntoDB,
  checkAccountStatusIntoDB,
  checkBankStatusAndTransferIntoDB,
  createStripeCheckoutSessionIntoDB,
  verifyStripeSessionIntoDB,
  singleWithdrawalProcessIntoDB
};
