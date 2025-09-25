/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Transaction } from './transaction.model';
import { TTransaction } from './transaction.interface';
import Stripe from 'stripe';
// import { withdrawRequestSearchableFields } from './transaction.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import config from '../../config';
import { Booking } from '../Booking/Booking.model';
import { User } from '../User/user.model';
import { PaymentServices } from '../payment/stripePaymentService';
import { withdrawRequestSearchableFields } from './transaction.constant';
import mongoose from 'mongoose';
// import mongoose from 'mongoose';
const stripe = new Stripe(config.stripe_secret_key as string);

function getCurrentDateAtMidnight(): string {
  const now = new Date();
  
  // Set the time to 00:00:00
  now.setHours(0, 0, 0, 0);  // Set hours, minutes, seconds, and milliseconds to 0
  
  return now.toISOString();  // This will return the date in ISO format (UTC)
}


const createSingleTransactionIntoDB = async (
payload: TTransaction,
user: any,
) => {

if(payload.type === 'withdraw'){   
   

} else if(payload.type === 'booking'){
   console.log('payload', payload)
  const bookingData = await Booking.findById(payload.bookingId);
  if(!bookingData){
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  payload.amount = payload.amount || bookingData?.price as number
  payload.userId = payload.userId || bookingData?.contractorId as any
  payload.userId = payload.userId || bookingData?.customerId as any
  payload.paymentStatus = payload.paymentStatus || 'paid'
  const currentDate = getCurrentDateAtMidnight();
  payload.date = payload.date || currentDate ;

//   checking if the actor has already participated in the competition
  const existingTransaction = await Transaction.findOne({
    bookingId: payload.bookingId,
    customerId: payload.userId,
  });


  if (existingTransaction) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Transaction has already been created.'
    );
  }
   console.log('payload2', payload)
  const newTransaction = await Transaction.create(payload);

  if (!newTransaction) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Failed to create Transaction',
    );
  }

  return newTransaction;

 }else{
    return 'subscript should be here';
}


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




// const singleWithdrawalProcessIntoDB = async (
//   user: any,
//   payload: any,
// ) => {
//    let userData = null;

//   if (user?.role === 'contractor') {
//     userData = await User.findOne({ email: user.userEmail }).populate('contractor');
//   }
// let newTransaction;
//   const transactionData = {
//     userId: userData?._id,
//     type: 'withdraw',
//     amount: payload?.amount,
//   };

//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();

//      newTransaction = await Transaction.create(transactionData);
//     if (!newTransaction) {
//       throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Transaction');
//     }

//     // Check if the actor has a Stripe account ID, create one if they don’t
//     if (!userData?.stripeAccountId) {
//       const account = await stripe.accounts.create({
//         type: 'express',
//         email: userData?.email,
//       });

//       // Assign the Stripe account ID to the actor and save it
//       if (userData) {
//         userData.stripeAccountId = account.id;
//         await userData.save(); // Ensure save is part of the transaction
//         // await actor.save({ session }); // Ensure save is part of the transaction
//       }

//       let accountLink = null;

//       // // Create an account link for Stripe onboarding if the actor has a Stripe account ID
//       if (userData && userData.stripeAccountId) {
//         accountLink = await stripe.accountLinks.create({
//           account: userData.stripeAccountId,
//           refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
//           return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`, // Include actorId here
//           type: 'account_onboarding',
//         });
//       }

//       // Commit transaction if everything went well
//       // await session.commitTransaction();
//       return { url: accountLink?.url };
//     }


//     ///
//     const stripeAccountId = userData?.stripeAccountId
//     const account = await stripe.accounts.retrieve(stripeAccountId as string);


//     if (account?.requirements?.currently_due?.includes("external_account")) {

//       // Bank info is not complete, trigger to generate onboarding link
//       let accountLink = null;

//       // Create an account link for Stripe onboarding if the actor has a Stripe account ID
//       if (userData && userData.stripeAccountId) {
//         accountLink = await stripe.accountLinks.create({
//           account: userData.stripeAccountId,
//           refresh_url: `${config.frontend_url}/session/bank-info-required?userId=${userData?._id}`,
//           return_url: `${config.frontend_url}/session/bank-info-successfull?userId=${userData?._id}`, // Include actorId here
//           type: 'account_onboarding',
//         });
//       }
//       // await session.commitTransaction();
//       return { url: accountLink?.url };
//     }


//   const result = await PaymentServices.withdrawalProcessPaymentIntoDB(newTransaction?.amount, user?.stripeAccountId as string);

//   if (result && newTransaction) {

//     newTransaction.paymentStatus = 'paid';
//     await newTransaction.save();
//   }

//   return result;

//   } catch (err: any) {
//     // Rollback transaction on error
//     // await session.abortTransaction();
//     throw new Error(err.message); // Re-throw error to handle it outside if needed
//   } finally {
//     // End the session
//     // await session.endSession();
//   }
// };



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
//   singleWithdrawalProcessIntoDB,
  getAllwithdrawalRequestsFromDB,
  getAllTransactionsFromDB,
};