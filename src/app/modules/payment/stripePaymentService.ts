/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import Stripe from 'stripe';
import config from '../../config';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { User } from '../User/user.model';
import { Transaction } from '../Transaction/transaction.model';
import { Contractor } from '../Contractor/Contractor.model';
import { Booking } from '../Booking/Booking.model';
import { Plans } from '../Subscription/Subscription.model';
const stripe = new Stripe(config.stripe_secret_key as string);

// const createStripeSubscriptionSessionIntoDB = async (user: any, paymentData: any) => {
//   const email = user?.userEmail;
//   const { planId } = paymentData;

//   // Validate plan
//   const plan = await Plans.findById(planId);
//   if (!plan) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Subscription plan not found');
//   }

//   // Validate user
//   const userData = await User.findOne({ email });
//   if (!userData?.contractor) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//   }

//   const metadata = {
//     payUser: userData?.contractor.toString(),
//     subscriptionId: plan._id.toString(),
//     type: 'subscription',
//     amount: String(plan.price),
//   };

//   // 1️⃣ Create Stripe Product (optional, but good for clarity)
//   const product = await stripe.products.create({
//     name: `${plan.planType.toUpperCase()} Plan (${plan.duration})`,
//     description: `Includes: ${plan.details?.join(', ') || 'Standard features'}`,
//   });


//   const interval =
//     plan.duration === 'Yearly'
//       ? 'year'
//       : plan.duration === 'Monthly'
//         ? 'month'
//         : 'month';

//   const price = await stripe.prices.create({
//     product: product.id,
//     unit_amount: Math.round(Number(plan.price) * 100),
//     currency: 'usd',
//     recurring: { interval },
//   });


//   const session = await stripe.checkout.sessions.create({
//     mode: 'subscription',
//     success_url: `${config.frontend_url}/payments/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.frontend_url}/payments/subscription/cancel`,
//     customer_email: email,
//     metadata,
//     subscription_data: {
//       metadata,
//     },
//     line_items: [
//       {
//         price: price.id,
//         quantity: 1,
//       },
//     ],
//   });

//   return session.url as string;
// };


const createStripeSubscriptionSessionIntoDB = async (user: any, paymentData: any) => {
  const email = user?.userEmail;
  const { planId } = paymentData;

  // 1️⃣ Validate plan
  const plan = await Plans.findById(planId);
  if (!plan) throw new AppError(httpStatus.NOT_FOUND, "Subscription plan not found");

  // 2️⃣ Validate user
  const userData = await User.findOne({ email });
  if (!userData?.contractor) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  // 3️⃣ Prepare metadata
  const metadata = {
    payUser: userData.contractor.toString(),
    subscriptionId: plan._id.toString(),
    type: "subscription",
    amount: String(plan.price),
  };

  // 4️⃣ Create Stripe Product (optional, good for clarity)
  const product = await stripe.products.create({
    name: `${plan.planType.toUpperCase()} Plan (${plan.duration})`,
    description: `Includes: ${plan.details?.join(", ") || "Standard features"}`,
  });

  const interval = plan.duration === "Yearly" ? "year" : "month";

  // 5️⃣ Create Stripe Price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(Number(plan.price) * 100), // price in cents
    currency: "usd",
    recurring: { interval },
  });

  // 6️⃣ Create or retrieve customer (required for Accounts V2)
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

  // 7️⃣ Create Stripe Checkout Session
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
          currency: 'usd',
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
  // webhookToService,
  withdrawalProcessPaymentIntoDB,
  // createSingleStripePaymentIntoDB,
  confirmStripePaymentIntoDB,
  checkAccountStatusIntoDB,
  checkBankStatusAndTransferIntoDB,
  createStripeCheckoutSessionIntoDB,
  singleWithdrawalProcessIntoDB,
  createStripeSubscriptionSessionIntoDB
};
