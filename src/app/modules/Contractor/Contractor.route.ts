import express from 'express';
import { ContractorControllers } from './Contractor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { updateContractorValidationSchema } from './Contractor.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.get(
  '/notifications',
  auth(USER_ROLE.contractor),
  ContractorControllers.getMyNotifications
);

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
router.post('/materials', ContractorControllers.createMaterials);
router.patch('/materials', ContractorControllers.updateMaterials);
router.delete('/materials/:id', ContractorControllers.deleteMaterials);

export const ContractorRoutes = router;
