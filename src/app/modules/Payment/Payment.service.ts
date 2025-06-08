/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { PAYMENT_SEARCHABLE_FIELDS } from './Payment.constant';
import mongoose from 'mongoose';
// import { TPayment } from './Payment.interface';
import { Payment } from './Payment.model';
import { User } from '../User/user.model';
import { Card } from '../Card/Card.model';
import Stripe from 'stripe';
import config from '../../config';
import { Buffer } from 'buffer';
const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2022-11-15' as any,
});
const endpointSecret = config.stripe_webhook_secret as string;

const createPaymentIntoDB = async (
  payload: any,
) => {
  const { userId, cardId, amount } = payload;

  if (!userId || !cardId || !amount) {
    // throw new AppError(httpStatus.BAD_REQUEST, 'userId and paymentMethodId are required');
    return { error: 'Missing params' }
  };

const user = await User.findById(userId);
  // if (!user) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  // }
  if (!user || !user.customerId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User or Stripe customer not found');
  }


  const card = await Card.findById(cardId);
  if (!card) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Card not found');
    // return res.status(404).json({ error: 'Card not found' });
  }


    try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: user.customerId,
      payment_method: card.paymentMethodId,
      // off_session: true,
      // confirm: false,
    });


    return { clientSecret: paymentIntent.client_secret, status: paymentIntent.status }

    // res.json({ clientSecret: paymentIntent.client_secret, status: paymentIntent.status });
  } catch (err:any) {
     return { error: err.message }
  }
};
const processWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    console.log('Verified event:', event.type);
  } catch (err: any) {
    console.error('Signature verification failed:', err.message);
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  switch(event.type) {
  case 'payment_intent.succeeded': {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
    // Update your DB/payment status here or trigger notification
    break;
  }
      case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${failedIntent.last_payment_error?.message}`);
      // Update failure status here
      break;
    }
  case 'charge.succeeded': {
    const charge = event.data.object as Stripe.Charge;
    console.log(`Charge succeeded: ${charge.id}`);
    // Update charge/payment info as needed
    break;
  }
  // handle other event types if needed
  default:
    console.log(`Unhandled event type: ${event.type}`);
}
};


// //   case 'charge.updated': {
// //     const charge = event.data.object as Stripe.Charge;
// //     console.log(`Charge updated: ${charge.id}`);
// //     // Your logic here
// //     break;
// //   }


const getAllPaymentsFromDB = async (query: Record<string, unknown>) => {
  const PaymentQuery = new QueryBuilder(
    Payment.find(),
    query,
  )
    .search(PAYMENT_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await PaymentQuery.modelQuery;
  const meta = await PaymentQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSinglePaymentFromDB = async (id: string) => {
  const result = await Payment.findById(id);

  return result;
};

const updatePaymentIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('payments')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('Payment not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Payment');
  }

  const updatedData = await Payment.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Payment not found after update');
  }

  return updatedData;
};

const deletePaymentFromDB = async (id: string) => {
  const deletedService = await Payment.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Payment');
  }

  return deletedService;
};

export const PaymentServices = {
  createPaymentIntoDB,
  getAllPaymentsFromDB,
  getSinglePaymentFromDB,
  updatePaymentIntoDB,
  deletePaymentFromDB,
  processWebhook
};
