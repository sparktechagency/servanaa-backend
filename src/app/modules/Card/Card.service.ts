/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CARD_SEARCHABLE_FIELDS } from './Card.constant';
import mongoose from 'mongoose';
import { TCard } from './Card.interface';
import { Card } from './Card.model';
import { User } from '../User/user.model';
import Stripe from 'stripe';
import config from '../../config';


const stripe = new Stripe(config.stripe_secret_key as string, {
   apiVersion: '2022-11-15' as any,
});


async function getOrCreateCustomer(user: any) {

  if (user.customerId) return user.customerId;


  const customer = await stripe.customers.create({ email: user.email });

  // Update the user object locally
  user.customerId = customer.id;

  try {
     await User.findByIdAndUpdate(
      user._id,
      { customerId: customer.id },
      { new: true } // return updated document
    );
  } catch (err) {
    console.error("Failed to update user:", err);
    throw err;
  }

  return customer.id;
}


const createCardIntoDB = async (
  payload: TCard,
) => {

const { userId, paymentMethodId } = payload;

  if (!userId || !paymentMethodId) {
    // throw new AppError(httpStatus.BAD_REQUEST, 'userId and paymentMethodId are required');
    return { error: 'Missing params' }
  };

  const user = await User.findById(userId);
    // console.log(user, "user");

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'User not found');
  }

  const customerId = await getOrCreateCustomer(user);

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);


  const card = new Card({
    userId: user._id,
    paymentMethodId: paymentMethod.id,
    cardBrand: paymentMethod?.card?.brand,
    last4: paymentMethod?.card?.last4,
    expMonth: paymentMethod?.card?.exp_month,
    expYear: paymentMethod?.card?.exp_year,
  });

  const result = await card.save();
    
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Card');
  }
  
  return result;
};

const getAllCardsFromDB = async (query: Record<string, unknown>, userId: string) => {
  const CardQuery = new QueryBuilder(
    Card.find({ userId }),
    query,
  )
    .search(CARD_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await CardQuery.modelQuery;
  const meta = await CardQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleCardFromDB = async (id: string) => {
  const result = await Card.findById(id);

  return result;
};

const updateCardIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('cards')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      // { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService) {
    throw new Error('Card not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Card');
  }

  const updatedData = await Card.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Card not found after update');
  }

  return updatedData;
};

const deleteCardFromDB = async (id: string) => {
  const deletedService = await Card.findByIdAndDelete(
    id,
    // { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Card');
  }

  return deletedService;
};

export const CardServices = {
  createCardIntoDB,
  getAllCardsFromDB,
  getSingleCardFromDB,
  updateCardIntoDB,
  deleteCardFromDB,
};
