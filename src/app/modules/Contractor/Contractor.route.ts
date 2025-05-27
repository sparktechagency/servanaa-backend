import express from 'express';
import { ContractorControllers } from './Contractor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { updateContractorValidationSchema } from './Contractor.validation';

const router = express.Router();


router.get(
  '/:id',
  ContractorControllers.getSingleContractor,
);

router.patch(
  '/:id',
  validateRequest(updateContractorValidationSchema),
  ContractorControllers.updateContractor,
);

router.delete(
  '/:id',
  ContractorControllers.deleteContractor,
);

router.get(
  '/',
  ContractorControllers.getAllContractors,
);

export const ContractorRoutes = router;
