import express from 'express';
import { ContractorControllers } from './Contractor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { updateContractorValidationSchema } from './Contractor.validation';
import { USER_ROLE } from '../User/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get('/available', ContractorControllers.getAllAvailableContractors);

router.get('/:id', ContractorControllers.getSingleContractor);

router.patch(
  '/:id',
  validateRequest(updateContractorValidationSchema),
  ContractorControllers.updateContractor
);

router.delete('/:id', ContractorControllers.deleteContractor);

router.get('/', ContractorControllers.getAllContractors);
// ===============
router.post('/materials',
  auth(USER_ROLE.contractor),
  ContractorControllers.createMaterials);
router.put('/materials',
  auth(USER_ROLE.contractor),
  ContractorControllers.updateMaterials);
router.delete('/materials/:id',
  auth(USER_ROLE.contractor),
  ContractorControllers.deleteMaterials);

export const ContractorRoutes = router;
