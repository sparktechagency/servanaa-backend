import express from 'express';
import { ReviewControllers } from './Review.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createReviewValidationSchema, updateReviewValidationSchema } from './Review.validation';

const router = express.Router();

router.post(
  '/create-review',
  validateRequest(createReviewValidationSchema),
  ReviewControllers.createReview,
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

export const ReviewRoutes = router;
