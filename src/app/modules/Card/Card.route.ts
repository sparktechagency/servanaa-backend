import express from 'express';
import { CardControllers } from './Card.controller';
import validateRequest from '../../middlewares/validateRequest';
import {  updateCardValidationSchema } from './Card.validation';
// import { createCardValidationSchema, updateCardValidationSchema } from './Card.validation';

const router = express.Router();

router.post(
  '/create-card',
  // validateRequest(createCardValidationSchema),
  CardControllers.createCard,
);

router.get(
  '/:id',
  CardControllers.getSingleCard,
);

router.patch(
  '/:id',
  validateRequest(updateCardValidationSchema),
  CardControllers.updateCard,
);

router.delete(
  '/:id',
  CardControllers.deleteCard,
);

// router.get(
//   '/',
//   CardControllers.getAllCards,
// );
router.get(
  '/all-cards/:id',
  CardControllers.getAllCards,
);

export const CardRoutes = router;
