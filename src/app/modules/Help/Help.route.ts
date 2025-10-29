import express from 'express';
import { HelpControllers } from './Help.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createHelpValidationSchema, updateHelpValidationSchema } from './Help.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import { ContractorControllers } from '../Contractor/Contractor.controller';

const router = express.Router();

router.post(
  '/create-help',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  validateRequest(createHelpValidationSchema),
  HelpControllers.createHelp,
);

router.get(
  '/:id',
  HelpControllers.getSingleHelp,
);

router.patch(
  '/:id',
  auth(USER_ROLE.superAdmin),
  validateRequest(updateHelpValidationSchema),
  HelpControllers.updateHelp,
);

router.delete(
  '/:id',
  HelpControllers.deleteHelp,
);

router.get(
  '/',
  ContractorControllers.getAllSupport,
);

export const HelpRoutes = router;
