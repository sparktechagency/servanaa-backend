/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Stripe from 'stripe';

import config from '../../config';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { User } from '../User/user.model';
/* eslint-disable @typescript-eslint/no-explicit-any */
const stripe = new Stripe(config.stripe_secret_key as string);

const createSingleStripePaymentIntoDB = async (
  user: any,
  paymentData: any,
): Promise<string> => {
  const { competitionId } = paymentData;

  // const competition = await Competition.findById(competitionId);
  // if (!competition) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Competition not found');
  // }

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

  //   const currency = customerRegion === 'EU' ? 'eur' : 'usd';
  // const paymentMethods = currency === 'eur' 
  //     ? ['card', 'ideal', 'sofort', 'paypal'] 
  //     : ['card', 'paypal', 'afterpay_clearpay'];

  // const paymentIntent = await stripe.paymentIntents.create({
  //     amount: Number(competition.entryFee),
  //     currency,
  //     payment_method_types: paymentMethods,
  //     metadata,
  //     description: 'Competition Entry Fee',
  // });
}
const createStripeCheckoutSessionIntoDB = async (
  user: any,
  paymentData: any,
): Promise<string> => {
 
// console.log('paymentData', paymentData)
// if(user?.email === undefined || user?.email === null){
// user.email = user.email || 'ahmadmusa9805@gmail.com'

// }

const email = user?.email || 'ahmadmusa9805@gmail.com'

const { serviceId = 'ahmadmusa', unitAmount = 50, currency= 'USD' } = paymentData;

    let session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${'http://localhost:5173'}/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${'http://localhost:5173'}/cancel`,
      customer_email: `${email}`,
      // customer_email: `${user?.email}`,
      // client_reference_id: serviceId,
      metadata: {
        payUser: 'ahmadmusa',
        // payUserType: payUserRole,
        // receiveUser: receiveUser.toHexString(),
        // receiveUserType: receiveUserRole,
        // serviceId: serviceId,
        // stripeAccountId: bankAccount?.stripeAccountId,
        // partnerId: partnerId,
        // winBid: bidDetails.price,
      },
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Number(parseFloat(unitAmount).toFixed(2)),
            product_data: {
              name: 'Servana Service Payment',
              // name: service.service,
              description:  `Service ID: ahmadmusa`,
              // description:  `Service ID: ${serviceId} | ${service.description}`,
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
    if(!metadata){
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
  } catch (err:any) {
    throw new Error(err)
  }
};

const confirmStripePaymentIntoDB = async (paymentIntentId: string) => {
  const confirmedPaymentIntent =
    await stripe.paymentIntents.confirm(paymentIntentId);

  return confirmedPaymentIntent;
};

const checkAccountStatusIntoDB = async (id: any) => {
  const actor = await User.findById(id).populate('userId');
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

const checkBankStatusIntoDB = async (id: any) => {
  const actor = await User.findById(id).populate('userId');
  const stripeAccountId = actor?.stripeAccountId
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
    return { message: "Bank information still incomplete" };
  }

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

export const PaymentServices = {
  checkPaymentCompletefromDB,
  webhookToService,
  // withdrawalProcessPaymentIntoDB,
  createSingleStripePaymentIntoDB,
  confirmStripePaymentIntoDB,
  checkAccountStatusIntoDB,
  checkBankStatusIntoDB,
  createStripeCheckoutSessionIntoDB,
  verifyStripeSessionIntoDB,
};
