import express from 'express';
import { CancelControllers } from './Cancel.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCancelValidationSchema, updateCancelValidationSchema } from './Cancel.validation';

const router = express.Router();

router.post(
  '/create-cancel',
  validateRequest(createCancelValidationSchema),
  CancelControllers.createCancel,
);

router.get(
  '/:id',
  CancelControllers.getSingleCancel,
);

router.patch(
  '/:id',
  validateRequest(updateCancelValidationSchema),
  CancelControllers.updateCancel,
);

router.delete(
  '/:id',
  CancelControllers.deleteCancel,
);

router.get(
  '/',
  CancelControllers.getAllCancels,
);

export const CancelRoutes = router;
