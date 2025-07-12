import express from 'express';
import { NotificationControllers } from './Notification.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createNotificationValidationSchema, updateNotificationValidationSchema } from './Notification.validation';

const router = express.Router();

router.post(
  '/create-notification',
  validateRequest(createNotificationValidationSchema),
  NotificationControllers.createNotification,
);

router.get(
  '/:id',
  NotificationControllers.getSingleNotification,
);

router.patch(
  '/:id',
  validateRequest(updateNotificationValidationSchema),
  NotificationControllers.updateNotification,
);
router.patch(
  '/:id',
  validateRequest(updateNotificationValidationSchema),
  NotificationControllers.updateNotification,
);

router.delete(
  '/:id',
  NotificationControllers.deleteNotification,
);

router.get(
  '/',
  NotificationControllers.getAllNotifications,
);

export const NotificationRoutes = router;
