import express from 'express';
import { TransactionHistoryControllers } from './TransactionHistory.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createTransactionHistoryValidationSchema, updateTransactionHistoryValidationSchema } from './TransactionHistory.validation';

const router = express.Router();

router.post(
  '/create-TransactionHistory',
  validateRequest(createTransactionHistoryValidationSchema),
  TransactionHistoryControllers.createTransactionHistory,
);

router.get(
  '/:id',
  TransactionHistoryControllers.getSingleTransactionHistory,
);

router.patch(
  '/:id',
  validateRequest(updateTransactionHistoryValidationSchema),
  TransactionHistoryControllers.updateTransactionHistory,
);

router.delete(
  '/:id',
  TransactionHistoryControllers.deleteTransactionHistory,
);

router.get(
  '/',
  TransactionHistoryControllers.getAllTransactionHistorys,
);

export const TransactionHistoryRoutes = router;
