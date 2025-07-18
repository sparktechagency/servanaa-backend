/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';

import { Transaction } from './transaction.model';
import { TTransaction } from './transaction.interface';
import Stripe from 'stripe';
import { withdrawRequestSearchableFields } from './transaction.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import config from '../../config';
// import mongoose from 'mongoose';
const stripe = new Stripe(config.stripe_secret_key as string);

const createSingleTransactionIntoDB = async (
  user: any,
  payload: TTransaction,
) => {





  // const competition = await Competition.findById(payload.competitionId);

  // payload.amount = competition?.entryFee as string
  // payload.actorId = actor?._id



  // checking if the actor has already participated in the competition
  // const existingTransaction = await Transaction.findOne({
  //   competitionId: payload.competitionId,
  //   actorId: payload.actorId,
  // });


  // if (existingTransaction) {
  //   throw new AppError(
  //     httpStatus.CONFLICT,
  //     'Transaction has already been created.'
  //   );
  // }


  const newTransaction = await Transaction.create(payload);

  if (!newTransaction) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create Transaction',
    );
  }

  return newTransaction;
};
const getSingleTransactionFromDB = async (id: string) => {

  const transaction = await Transaction.findById(id)
  return transaction;
};

const updateSingleTransactionIntoDB = async (
  id: string,
  payload: Partial<TTransaction>,
) => {

  const result = await Transaction.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (result) {
    // const competitionResultData = await CompetitionResult.findOne({ competitionId: result?.competitionId, winnerId: result?.actorId });
    // if (competitionResultData) {
    //   competitionResultData.withdrawalStatus = "approved";
    //   await competitionResultData.save();
    // }

    // const revenueSharingActorData = await RevenueSharingActor.findOne({ competitionId: result?.competitionId, profitRecipientId: result?.actorId });
    // if (revenueSharingActorData) {
    //   revenueSharingActorData.withdrawalStatus = "approved";
    //   await revenueSharingActorData.save();
    // }

    return result
  }

};

const singleWithdrawalRequestIntoDB = async (user: any, payload: any) => {
  let actor = null;

  if (user.role === 'actor') {
    actor = await Actor.findOne({ email: user.userEmail }).populate('userId');
  }

  const getCompetitionResult = await CompetitionResult.findOne({ competitionId: payload.competitionId, winnerId: actor?._id });

  const id = getCompetitionResult?._id

  await CompetitionResult.findByIdAndUpdate(id, { withdrawalStatus: "pending" }, {
    new: true,
    runValidators: true,
  });

  if (!getCompetitionResult) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Competition Result not found'
    )
  }

  const transactionData = {
    actorId: actor?._id,
    competitionId: payload.competitionId,
    type: 'withdrawal',
    amount: payload?.amount,
  };

  // const session = await mongoose.startSession();
  try {
    // session.startTransaction();

    const newTransaction = await Transaction.create(transactionData);
    if (!newTransaction) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Transaction');
    }

    // Check if the actor has a Stripe account ID, create one if they don’t
    if (!actor?.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: actor?.email,
      });

      // Assign the Stripe account ID to the actor and save it
      if (actor) {
        actor.stripeAccountId = account.id;
        await actor.save(); // Ensure save is part of the transaction
        // await actor.save({ session }); // Ensure save is part of the transaction
      }

      let accountLink = null;

      // // Create an account link for Stripe onboarding if the actor has a Stripe account ID
      if (actor && actor.stripeAccountId) {
        accountLink = await stripe.accountLinks.create({
          account: actor.stripeAccountId,
          refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
          return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
          type: 'account_onboarding',
        });
      }

      // Commit transaction if everything went well
      // await session.commitTransaction();
      return { url: accountLink?.url };
    }


    ///
    const stripeAccountId = actor?.stripeAccountId
    const account = await stripe.accounts.retrieve(stripeAccountId as string);


    if (account?.requirements?.currently_due?.includes("external_account")) {

      // Bank info is not complete, trigger to generate onboarding link
      let accountLink = null;

      // Create an account link for Stripe onboarding if the actor has a Stripe account ID
      if (actor && actor.stripeAccountId) {
        accountLink = await stripe.accountLinks.create({
          account: actor.stripeAccountId,
          refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
          return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
          type: 'account_onboarding',
        });
      }
      // await session.commitTransaction();
      return { url: accountLink?.url };
    }
  } catch (err: any) {
    // Rollback transaction on error
    // await session.abortTransaction();
    throw new Error(err.message); // Re-throw error to handle it outside if needed
  } finally {
    // End the session
    // await session.endSession();
  }
};

const singleWithdrawalProcessIntoDB = async (
  user: any,
  payload: any,
) => {
  let actor = null;

  if (user.role === 'actor') {
    actor = await Actor.findOne({ email: user.userEmail });
  }

  const transactions = await Transaction.findOne({ competitionId: payload.competitionId, actorId: actor?._id, paymentStatus: 'pending', type: 'withdrawal' });

  if (!transactions || transactions?.paymentStatus !== 'pending') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'In valid transaction',
    );
  }

  if (transactions?.adminPermission === 'pending') {
    return { message: "Admin permission is pending" };
  }


  const account = await stripe.accounts.retrieve(actor?.stripeAccountId as string);

  if (account?.requirements?.currently_due?.includes("external_account")) {

    // Bank information is missing, generate a new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: actor?.stripeAccountId as string,
      refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`, // Replace with your URL
      return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
      type: 'account_onboarding',
    });

    // Send the onboarding link to the user so they can complete their bank information
    return { url: accountLink.url };
  }

  // }



  const result = await PaymentServices.withdrawalProcessPaymentIntoDB(transactions, actor?.stripeAccountId as string);

  if (result) {

    const competitionResults = await CompetitionResult.findOne({ competitionId: transactions?.competitionId, winnerId: transactions?.actorId });

    if (!competitionResults) {
      throw new Error('Competition Result not found');
    }
    competitionResults.withdrawalStatus = 'received';
    await competitionResults.save();

    transactions.paymentStatus = 'completed';
    await transactions.save();
  }

  return result;
};
const singleWithdrawalRequestRevenueIntoDB = async (user: any, payload: any) => {


  let actor = null;

  if (user.role === 'actor') {
    actor = await Actor.findOne({ email: user.userEmail }).populate('userId');
  }


  const getRevenueSharingActor = await RevenueSharingActor.findOne({ competitionId: payload.competitionId, profitRecipientId: actor?._id });

  const id = getRevenueSharingActor?._id

  await RevenueSharingActor.findByIdAndUpdate(id, { withdrawalStatus: "pending" }, {
    new: true,
    runValidators: true,
  });

  if (!getRevenueSharingActor) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'RevenueSharingActor Result not found'
    )
  }

  const transactionData = {
    actorId: actor?._id,
    competitionId: payload.competitionId,
    // competitionId: getCompetition?._id,
    type: 'withdrawal',
    amount: payload?.amount,
  };

  // const session = await mongoose.startSession();
  try {
    // session.startTransaction();

    // Create a new transaction record in the database
    const newTransaction = await Transaction.create(transactionData);
    if (!newTransaction) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Transaction');
    }

    // Check if the actor has a Stripe account ID, create one if they don’t
    if (!actor?.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: actor?.email,
      });

      // Assign the Stripe account ID to the actor and save it
      if (actor) {
        actor.stripeAccountId = account.id;
        await actor.save(); // Ensure save is part of the transaction
        // await actor.save({ session }); // Ensure save is part of the transaction
      }

      let accountLink = null;

      // // Create an account link for Stripe onboarding if the actor has a Stripe account ID
      if (actor && actor.stripeAccountId) {
        accountLink = await stripe.accountLinks.create({
          account: actor.stripeAccountId,
          refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
          return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
          type: 'account_onboarding',
        });
      }

      // Commit transaction if everything went well
      // await session.commitTransaction();
      return { url: accountLink?.url };
    }


    ///
    const stripeAccountId = actor?.stripeAccountId
    const account = await stripe.accounts.retrieve(stripeAccountId as string);


    if (account?.requirements?.currently_due?.includes("external_account")) {

      // Bank info is not complete, trigger to generate onboarding link
      let accountLink = null;

      // Create an account link for Stripe onboarding if the actor has a Stripe account ID
      if (actor && actor.stripeAccountId) {
        accountLink = await stripe.accountLinks.create({
          account: actor.stripeAccountId,
          refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`,
          return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
          type: 'account_onboarding',
        });
      }
      // await session.commitTransaction();
      return { url: accountLink?.url };
    }
  } catch (err: any) {
    // Rollback transaction on error
    // await session.abortTransaction();
    throw new Error(err.message); // Re-throw error to handle it outside if needed
  } finally {
    // End the session
    // await session.endSession();
  }
};
const singleWithdrawalProcessRevenueIntoDB = async (
  user: any,
  payload: any,
) => {
  let actor = null;

  if (user.role === 'actor') {
    actor = await Actor.findOne({ email: user.userEmail });
  }


  const transactions = await Transaction.findOne({ competitionId: payload.competitionId, actorId: actor?._id, paymentStatus: 'pending', type: 'withdrawal' });

  if (!transactions || transactions?.paymentStatus !== 'pending') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'In valid transaction',
    );
  }

  if (transactions?.adminPermission === 'pending') {
    return { message: "Admin permission is pending" };
  }


  const account = await stripe.accounts.retrieve(actor?.stripeAccountId as string);

  if (account?.requirements?.currently_due?.includes("external_account")) {

    // Bank information is missing, generate a new onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: actor?.stripeAccountId as string,
      refresh_url: `https://app.performroom.com/perform-learn/session/bank-info-required?actorId=${actor?._id}`, // Replace with your URL
      return_url: `https://app.performroom.com/perform-learn/session/bank-info-successfull?actorId=${actor?._id}`, // Include actorId here
      type: 'account_onboarding',
    });

    // Send the onboarding link to the user so they can complete their bank information
    return { url: accountLink.url };
  }

  // }



  const result = await PaymentServices.withdrawalProcessPaymentIntoDB(transactions, actor?.stripeAccountId as string);

  if (result) {

    const revenueSharingActor = await RevenueSharingActor.findOne({ competitionId: transactions?.competitionId, profitRecipientId: transactions?.actorId });

    if (!revenueSharingActor) {
      throw new Error('revenueSharingActor Result not found');
    }
    revenueSharingActor.withdrawalStatus = 'received';
    await revenueSharingActor.save();

    transactions.paymentStatus = 'completed';
    await transactions.save();
  }

  return result;
};
const getAllwithdrawalRequestsFromDB = async (query: Record<string, unknown>) => {

  const withdrawRequestQuery = new QueryBuilder(
    Transaction.find({ paymentStatus: 'pending', type: 'withdrawal' }).populate('actorId').populate('competitionId'),
    query,
  )
    .search(withdrawRequestSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await withdrawRequestQuery.countTotal();
  const result = await withdrawRequestQuery.modelQuery;


  return {
    meta,
    result,
  };
};
const getAllTransactionsFromDB = async (query: Record<string, unknown>) => {

  const TransactionQuery = new QueryBuilder(
    Transaction.find().populate('actorId').populate('competitionId'),
    query,
  )
    .search(withdrawRequestSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await TransactionQuery.countTotal();
  const result = await TransactionQuery.modelQuery;


  return {
    meta,
    result,
  };
};



export const TransactionServices = {
  createSingleTransactionIntoDB,
  getSingleTransactionFromDB,
  updateSingleTransactionIntoDB,
  singleWithdrawalRequestIntoDB,
  singleWithdrawalProcessIntoDB,
  getAllwithdrawalRequestsFromDB,
  getAllTransactionsFromDB,
  singleWithdrawalProcessRevenueIntoDB,
  singleWithdrawalRequestRevenueIntoDB
};