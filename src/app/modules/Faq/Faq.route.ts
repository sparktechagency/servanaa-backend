import express from 'express';
import { FaqControllers } from './Faq.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createFaqValidationSchema, updateFaqValidationSchema } from './Faq.validation';

const router = express.Router();

router.post(
  '/create-faq',
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

export const FaqRoutes = router;
