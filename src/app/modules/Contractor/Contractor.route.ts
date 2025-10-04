import express from 'express';
import { ContractorControllers } from './Contractor.controller';
import validateRequest from '../../middlewares/validateRequest';
import { updateContractorValidationSchema } from './Contractor.validation';

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
router.post('/materials', ContractorControllers.createMaterials);
router.patch('/materials', ContractorControllers.updateMaterials);
router.delete('/materials/:id', ContractorControllers.deleteMaterials);

export const ContractorRoutes = router;
