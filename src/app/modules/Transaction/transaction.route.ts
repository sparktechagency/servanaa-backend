import express from 'express';
import auth from '../../middlewares/auth';

import { USER_ROLE } from '../User/user.constant';

// import { TransactionControllers } from './transaction.controller';
import validateRequest from '../../middlewares/validateRequest';
import { TransactionControllers } from './transaction.controller';
// import { createTransactionValidationSchema, processValidationSchema, updateTransactionValidationSchema } from './transaction.validation';

const router = express.Router();

router.post(
  '/create-transaction',
//   auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
//   validateRequest(createTransactionValidationSchema),
  TransactionControllers.createSingleTransaction,
);

router.get(
  '/all-withdrawal-requests',
  auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
  TransactionControllers.getAllwithdrawalRequests,
);
router.get(
  '/',
  auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
  TransactionControllers.getAllTransactions,
);


router.get(
  '/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
  TransactionControllers.getSingleTransactionRequest,
);

router.patch(
  '/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
//   validateRequest(updateTransactionValidationSchema),
  TransactionControllers.updateSingleTransaction,
);



// router.post(
//   '/withdrawal-process',
//   auth(USER_ROLE.superAdmin, USER_ROLE.contractor, USER_ROLE.customer),
// //   validateRequest(processValidationSchema),
//   TransactionControllers.singleWithdrawalProcess,
// );


export const TransactionRoutes = router;
