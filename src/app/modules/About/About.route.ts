import express from 'express';
import { AboutControllers } from './About.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createAboutValidationSchema } from './About.validation';

const router = express.Router();

router.post(
  '/create-about',
  validateRequest(createAboutValidationSchema),
  AboutControllers.createAbout,
);

router.get(
  '/',
  AboutControllers.getSingleAbout,
);



export const AboutRoutes = router;
