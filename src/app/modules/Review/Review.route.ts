import express from 'express';
import { ReviewControllers } from './Review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createReviewValidationSchema, updateReviewValidationSchema } from './Review.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/create-review',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer),
  validateRequest(createReviewValidationSchema),
  ReviewControllers.createReview,
);

router.get(
  '/customers/:customerId',
  ReviewControllers.getAllReviewsCustomer,
);

router.get(
  '/contractor/:contractorId',
  ReviewControllers.getAllReviewsContractor,
);

router.get(
  '/get-average-review/:id',
  ReviewControllers.getAverageReview,
);
router.get(
  '/:id',
  ReviewControllers.getSingleReview,
);

router.patch(
  '/:id',
  validateRequest(updateReviewValidationSchema),
  ReviewControllers.updateReview,
);

router.delete(
  '/:id',
  ReviewControllers.deleteReview,
);

router.get(
  '/',
  ReviewControllers.getAllReviews,
);
// ============
router.post(
  '/create-review-customer',
  auth(USER_ROLE.superAdmin, USER_ROLE.contractor),
  ReviewControllers.createReviewCustomer,
);


export const ReviewRoutes = router;
