import express from 'express';
import { TermControllers } from './Term.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createTermValidationSchema } from './Term.validation';

const router = express.Router();

router.post(
  '/create-term',
  validateRequest(createTermValidationSchema),
  TermControllers.createTerm,
);

router.get(
  '/',
  TermControllers.getSingleTerm,
);



export const TermRoutes = router;
