import express from 'express';
import { HelpControllers } from './Help.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createHelpValidationSchema, updateHelpValidationSchema } from './Help.validation';

const router = express.Router();

router.post(
  '/create-help',
  validateRequest(createHelpValidationSchema),
  HelpControllers.createHelp,
);

router.get(
  '/:id',
  HelpControllers.getSingleHelp,
);

router.patch(
  '/:id',
  validateRequest(updateHelpValidationSchema),
  HelpControllers.updateHelp,
);

router.delete(
  '/:id',
  HelpControllers.deleteHelp,
);

router.get(
  '/',
  HelpControllers.getAllHelps,
);

export const HelpRoutes = router;
