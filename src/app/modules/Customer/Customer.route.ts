import express from 'express';
import { CustomerControllers } from './Customer.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createCustomerValidationSchema,
  updateCustomerValidationSchema
} from './Customer.validation';
import { USER_ROLE } from '../User/user.constant';
import auth from '../../middlewares/auth';

const router = express.Router();

router.get(
  '/notifications',
  auth(USER_ROLE.customer),
  CustomerControllers.getMyNotifications
);

router.post(
  '/create-Customer',
  validateRequest(createCustomerValidationSchema),
  CustomerControllers.createCustomer
);

router.get('/:id', CustomerControllers.getSingleCustomer);

router.patch(
  '/:id',
  validateRequest(updateCustomerValidationSchema),
  CustomerControllers.updateCustomer
);

router.delete('/:id', CustomerControllers.deleteCustomer);

router.get('/', CustomerControllers.getAllCustomers);

export const CustomerRoutes = router;
