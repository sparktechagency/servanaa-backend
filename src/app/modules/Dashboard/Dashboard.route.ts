// src/app/modules/Dashboard/Dashboard.route.ts

import express from 'express';
import {
  getAllAdminNotifications,
  getAllSubscriptionPlansTable,
  getCategoryTable,
  getContractorTableData,
  getDashboardData,
  getServiceTable,
  getSubCategoryTable
} from './Dashboard.controller';

const router = express.Router();

router.get('/', getDashboardData);

router.get('/subscription-plans', getAllSubscriptionPlansTable);
router.get('/contractor-manage', getContractorTableData);
router.get('/customer-manage', getContractorTableData);
router.get('/category', getCategoryTable);
router.get('/sub-category', getSubCategoryTable);
router.get('/service', getServiceTable);
router.get('/admin-notification', getAllAdminNotifications);

export const DashboardRoutes = router;
