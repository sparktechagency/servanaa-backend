import express from 'express';
import { MaterialControllers } from './Material.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createMaterialValidationSchema, updateMaterialValidationSchema } from './Material.validation';

const router = express.Router();

router.post(
  '/create-material',
  validateRequest(createMaterialValidationSchema),
  MaterialControllers.createMaterial,
);

router.get(
  '/:id',
  MaterialControllers.getSingleMaterial,
);

router.patch(
  '/:id',
  validateRequest(updateMaterialValidationSchema),
  MaterialControllers.updateMaterial,
);

router.delete(
  '/:id',
  MaterialControllers.deleteMaterial,
);

router.get(
  '/',
  MaterialControllers.getAllMaterials,
);

export const MaterialRoutes = router;
