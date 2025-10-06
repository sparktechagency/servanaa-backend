import express from 'express';
import { NotificationControllers } from './Notification.controller';
import validateRequest from '../../middlewares/validateRequest';
import {
  createNotificationValidationSchema,
  updateNotificationValidationSchema
} from './Notification.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.patch(
  '/mark-read/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  NotificationControllers.markAsRead
);

router.patch(
  '/mark-all-read',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  NotificationControllers.markAllAsRead
);

router.post(
  '/create-notification',
  validateRequest(createNotificationValidationSchema),
  NotificationControllers.createNotification
);

router.get('/:id', NotificationControllers.getSingleNotification);

router.patch(
  '/:id',
  validateRequest(updateNotificationValidationSchema),
  NotificationControllers.updateNotification
);
router.patch(
  '/:id',
  validateRequest(updateNotificationValidationSchema),
  NotificationControllers.updateNotification
);

router.delete('/:id', NotificationControllers.deleteNotification);

router.get('/', NotificationControllers.getAllNotifications);

export const NotificationRoutes = router;
