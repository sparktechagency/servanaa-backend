import express from 'express';
import { PrivacyControllers } from './Privacy.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createPrivacyValidationSchema } from './Privacy.validation';

const router = express.Router();

router.post(
  '/create-privacy',
  validateRequest(createPrivacyValidationSchema),
  PrivacyControllers.createPrivacy,
);

router.get(
  '/',
  PrivacyControllers.getSinglePrivacy,
);





export const PrivacyRoutes = router;
