import express from 'express';
import { FaqControllers } from './Question.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createFaqValidationSchema, updateFaqValidationSchema } from './Question.validation';

const router = express.Router();

router.post(
  '/create-question',
  validateRequest(createFaqValidationSchema),
  FaqControllers.createFaq,
);

router.get(
  '/:id',
  FaqControllers.getSingleFaq,
);

router.patch(
  '/:id',
  validateRequest(updateFaqValidationSchema),
  FaqControllers.updateFaq,
);

router.delete(
  '/:id',
  FaqControllers.deleteFaq,
);

router.get(
  '/',
  FaqControllers.getAllFaqs,
);

export const QuestionRoutes = router;
