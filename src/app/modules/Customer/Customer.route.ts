import express from 'express';
import { CustomerControllers } from './Customer.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createCustomerValidationSchema, updateCustomerValidationSchema } from './Customer.validation';

const router = express.Router();

router.post(
  '/create-Customer',
  validateRequest(createCustomerValidationSchema),
  CustomerControllers.createCustomer,
);

router.get(
  '/:id',
  CustomerControllers.getSingleCustomer,
);

router.patch(
  '/:id',
  validateRequest(updateCustomerValidationSchema),
  CustomerControllers.updateCustomer,
);

router.delete(
  '/:id',
  CustomerControllers.deleteCustomer,
);

router.get(
  '/',
  CustomerControllers.getAllCustomers,
);

export const CustomerRoutes = router;
