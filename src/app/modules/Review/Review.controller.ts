import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewServices } from './Review.service';

const createReview = catchAsync(async (req, res) => {
  const ReviewData = req.body;
  const result = await ReviewServices.createReviewIntoDB(ReviewData, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is created successfully',
    data: result,
  });
});

const getSingleReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewServices.getSingleReviewFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is retrieved successfully',
    data: result,
  });
});

const getAverageReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewServices.getAverageReviewFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is retrieved successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req, res) => {
  const result = await ReviewServices.getAllReviewsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;
  const result = await ReviewServices.updateReviewIntoDB(id, review);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is updated successfully',
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewServices.deleteReviewFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is deleted successfully',
    data: result,
  });
});

const createReviewCustomer = catchAsync(async (req, res) => {
  const ReviewData = req.body;
  const result = await ReviewServices.createReviewCustomer(ReviewData, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is created successfully',
    data: result,
  });
});


const getAllReviewsCustomer = catchAsync(async (req, res) => {
  const result = await ReviewServices.getAllReviewsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review is created successfully',
    data: result,
  });
});


export const ReviewControllers = {
  getAllReviewsCustomer,
  createReviewCustomer,
  createReview,
  getSingleReview,
  getAllReviews,
  updateReview,
  deleteReview,
  getAverageReview
};
