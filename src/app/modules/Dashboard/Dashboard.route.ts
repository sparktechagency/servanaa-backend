// src/app/modules/Dashboard/Dashboard.route.ts

import express, { NextFunction, Request, Response } from 'express';
import {
  approvedContactor,
  createBannerIntoDB,
  createSubscription,
  deleteBannerFromDB,
  deleteSubscription,
  getAllAdminNotifications,
  getAllBannersFromDB,
  getAllSubscriptionPlansTable,
  getBookingStatsByCategory,
  getDailyBooking,
  getDashboardData,
  getTransactionHistoryTable,
  totalCounts,
  updateBannerIntoDB,
  updateSubscription
} from './Dashboard.controller';
import { uploadFileS3 } from '../../utils/UploaderS3';

const router = express.Router();

router.get('/', getDashboardData);
router.get('/admin-notification', getAllAdminNotifications);
router.get('/subscription-plans', getAllSubscriptionPlansTable);
router.get('/transaction-history', getTransactionHistoryTable);
// ===========================
router.get('/subscription-plan', createSubscription);
router.patch('/subscription-plan/:id', updateSubscription);
router.delete('/subscription-plan/:id', deleteSubscription);
// =================================
router.post(
  '/create_banner',
  uploadFileS3(true).single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        return next(error);
      }
    }

    if (req.file && (req.file as any).location) {
      req.body.image = (req.file as any).location;
    }

    next();
  },
  createBannerIntoDB
);

router.get('/banners', getAllBannersFromDB);

router.patch(
  '/update_banner/:id',
  uploadFileS3(true).single('image'),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        return next(error);
      }
    }

    if (req.file && (req.file as any).location) {
      req.body.image = (req.file as any).location;
    }

    next();
  },
  updateBannerIntoDB
);

router.delete('/delete_banner/:id', deleteBannerFromDB);
router.get('/total_counts', totalCounts);
router.get('/get_booking_stats_by_category', getBookingStatsByCategory);
router.get('/get_daily_booking', getDailyBooking);
// ============================

router.post('/approved_contactor', approvedContactor);



export const DashboardRoutes = router;
