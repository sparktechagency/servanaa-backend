import express from 'express';
import { ReportControllers } from './Report.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createReportValidationSchema, updateReportValidationSchema } from './Report.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/create-report',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  validateRequest(createReportValidationSchema),
  ReportControllers.createReport,
);

// Demo for app store 
router.post(
  '/delete-account',
  ReportControllers.accountDelete,
);

router.get(
  '/:id',
  ReportControllers.getSingleReport,
);

router.patch(
  '/:id',
  validateRequest(updateReportValidationSchema),
  ReportControllers.updateReport,
);

router.delete(
  '/:id',
  ReportControllers.deleteReport,
);

router.get(
  '/',
  ReportControllers.getAllReports,
);

export const ReportRoutes = router;
