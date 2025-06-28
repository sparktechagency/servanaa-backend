import express from 'express';
import { MyScheduleControllers } from './MySchedule.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createMyScheduleValidationSchema } from './MySchedule.validation';
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
  auth(USER_ROLE.contractor),
  MyScheduleControllers.getSingleMySchedule,
);

router.patch(
  '/udate-schedule',
  auth(USER_ROLE.contractor),
  // validateRequest(updateMyScheduleValidationSchema),
  MyScheduleControllers.updateMySchedule,
);

router.delete(
  '/delete-schedule',
  auth(USER_ROLE.contractor),
  MyScheduleControllers.deleteMySchedule,
);

router.get(
  '/',
  MyScheduleControllers.getAllMySchedules,
);

export const MyScheduleRoutes = router;
