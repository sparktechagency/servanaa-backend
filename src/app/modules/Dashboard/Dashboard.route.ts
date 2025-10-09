// src/app/modules/Dashboard/Dashboard.route.ts

import express from 'express';
import {
  createSubscription,
  deleteSubscription,
  getAllAdminNotifications,
  getAllSubscriptionPlansTable,
  getCategoryTable,
  getContractorTableData,
  getDashboardData,
  getServiceTable,
  getSubCategoryTable,
  getTransactionHistoryTable,
  updateSubscription
} from './Dashboard.controller';

const router = express.Router();

router.get('/', getDashboardData);
router.get('/admin-notification', getAllAdminNotifications);
router.get('/subscription-plans', getAllSubscriptionPlansTable);
router.get('/transaction-history', getTransactionHistoryTable);
// ===========================
router.get('/subscription-plan', createSubscription);
router.patch('/subscription-plan/:id', updateSubscription);
router.delete('/subscription-plan/:id', deleteSubscription);

// router.get('/contractor-manage', getContractorTableData);
// router.get('/customer-manage', getCustomerTableData);
// router.get('/category', getCategoryTable);
// router.get('/sub-category', getSubCategoryTable);
// router.get('/service', getServiceTable);

export const DashboardRoutes = router;
