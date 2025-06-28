import express from 'express';
import { MyScheduleControllers } from './MySchedule.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createMyScheduleValidationSchema, updateMyScheduleValidationSchema } from './MySchedule.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/create-my-schedule',
  auth(USER_ROLE.contractor),
  validateRequest(createMyScheduleValidationSchema),
  MyScheduleControllers.createMySchedule,
);

router.get(
  '/:id',
  MyScheduleControllers.getSingleMySchedule,
);

router.patch(
  '/:id',
  validateRequest(updateMyScheduleValidationSchema),
  MyScheduleControllers.updateMySchedule,
);

router.delete(
  '/:id',
  MyScheduleControllers.deleteMySchedule,
);

router.get(
  '/',
  MyScheduleControllers.getAllMySchedules,
);

export const MyScheduleRoutes = router;
