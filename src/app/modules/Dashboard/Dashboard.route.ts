// src/app/modules/Dashboard/Dashboard.route.ts

import express from 'express';
import {
  getAllAdminNotifications,
  getAllSubscriptionPlansTable,
  getCategoryTable,
  getContractorTableData,
  getDashboardData,
  getServiceTable,
  getSubCategoryTable,
  getTransactionHistoryTable
} from './Dashboard.controller';

const router = express.Router();

router.get('/', getDashboardData);
router.get('/admin-notification', getAllAdminNotifications);
router.get('/subscription-plans', getAllSubscriptionPlansTable);
router.get('/transaction-history', getTransactionHistoryTable);

// router.get('/contractor-manage', getContractorTableData);
// router.get('/customer-manage', getCustomerTableData);
// router.get('/category', getCategoryTable);
// router.get('/sub-category', getSubCategoryTable);
// router.get('/service', getServiceTable);

export const DashboardRoutes = router;
