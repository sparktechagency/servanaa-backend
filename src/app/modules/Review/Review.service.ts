/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { REVIEW_SEARCHABLE_FIELDS } from './Review.constant';
import mongoose from 'mongoose';
import { TReview } from './Review.interface';
import { CustomerReview, Review } from './Review.model';
import { User } from '../User/user.model';
// import { Contractor } from '../Contractor/Contractor.model';
import { Booking } from '../Booking/Booking.model';
import { Customer } from '../Customer/Customer.model';

const createReviewIntoDB = async (
  payload: TReview,
  user: any
) => {

  const usr = await User.findOne({ email: user.userEmail }).select(' fullName img _id role');
  console.log('usr', usr)

  if (!usr) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  payload.customerId = usr?._id;

  const result = await Review.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Review');
  }

  return result;
};

const getAllReviewsFromDB = async (query: Record<string, unknown>) => {
  const ReviewQuery = new QueryBuilder(
    Review.find({
      $or: [
        { customerId: query.customerId },
        { providerId: query.providerId }
      ],
      isDeleted: false
    }),
    query,
  )
    .search(REVIEW_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ReviewQuery.modelQuery;
  const meta = await ReviewQuery.countTotal();
  return {
    result,
    meta,
  };
};

// const getAllReviewsFromDB = async (query: Record<string, unknown>) => {
//   const ReviewQuery = new QueryBuilder(
//     Review.find(),
//     query,
//   )
//     .search(REVIEW_SEARCHABLE_FIELDS)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await ReviewQuery.modelQuery;
//   const meta = await ReviewQuery.countTotal();
//   return {
//     result,
//     meta,
//   };
// };

const getSingleReviewFromDB = async (id: string) => {



  const result = await Review.findById(id);

  return result;
};
const getAverageReviewFromDB = async (id: string) => {
  const contractorId = id;
  const user = await User.findById(contractorId).populate({
    path: 'contractor',
    populate: {
      path: 'myScheduleId'
    }
  });

  // Fetch only latest 3 reviews
  const threeReviews = await Review.find({ contractorId })
    .populate({
      path: 'customerId',
      select: "img fullName"
    })
    .sort({ createdAt: -1 })
    .limit(3);

  const reviews = await Review.find({ contractorId });
  const totalRatings = reviews.length;
  const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
  const averageRating = totalRatings > 0 ? (totalStars / totalRatings).toFixed(1) : "No ratings yet";


  const completedOrder = await Booking.find({ contractorId, status: 'completed' });
  const totalCompletedOrder = completedOrder.length;

  return { user, averageRating, totalCompletedOrder, reviews: threeReviews };
};

const updateReviewIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('reviews')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('Review not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Review');
  }

  const updatedData = await Review.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Review not found after update');
  }

  return updatedData;
};

const deleteReviewFromDB = async (id: string) => {
  const deletedService = await Review.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Review');
  }

  return deletedService;
};

const createReviewCustomer = async (payload: TReview, user: any) => {
  const usr = await User.findOne({ email: user.userEmail }).select('fullName img _id role');

  if (!usr) throw new AppError(httpStatus.NOT_FOUND, 'User not found');

  payload.contractorId = usr._id;

  let customerUserId = payload.customerId;
  const customerDoc = await Customer.findById(payload.customerId);
  if (customerDoc) {
    customerUserId = customerDoc.userId;
    payload.customerId = customerDoc.userId;
  }

  const result = await CustomerReview.create(payload);
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Review');

  const stats = await CustomerReview.find({ customerId: payload.customerId, isDeleted: false });

  let averageRating = 0;
  if (stats.length > 0) {
    const totalStars = stats.reduce((sum, review) => sum + review.stars, 0);
    averageRating = totalStars / stats.length;
    averageRating = Math.round(averageRating * 10) / 10;
  }

  console.log('Customer User ID:', customerUserId.toString());
  console.log('New Average Rating:', averageRating);

  const updateResult = await Customer.updateOne(
    { userId: customerUserId },
    { $set: { ratings: averageRating } }
  );

  if (updateResult.modifiedCount === 0) {
    console.warn('⚠️ No Customer document was updated for ID:', customerUserId);
  }

  return {
    message: 'Review created successfully',
    review: result,
    averageRating,
  };
};


const getAllReviewsCustomer = async (query: any, customerId: any) => {
  const ReviewQuery = new QueryBuilder(
    CustomerReview.find({ customerId }).populate('contractorId', 'img fullName contactNo email'),
    query,
  )
    .search(REVIEW_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ReviewQuery.modelQuery;
  const meta = await ReviewQuery.countTotal();
  return {
    result,
    meta,
  };
};

export const ReviewServices = {
  getAllReviewsCustomer,
  createReviewCustomer,
  createReviewIntoDB,
  getAllReviewsFromDB,
  getSingleReviewFromDB,
  updateReviewIntoDB,
  deleteReviewFromDB,
  getAverageReviewFromDB
};
