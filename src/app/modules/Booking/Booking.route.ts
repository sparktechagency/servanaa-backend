import express from 'express';
import { BookingControllers } from './Booking.controller';
import validateRequest from '../../middlewares/validateRequest';
import { bookingValidationSchema, updateBookingValidationSchema } from './Booking.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

const router = express.Router();

router.post(
  '/create-booking',
  auth(USER_ROLE.superAdmin,  USER_ROLE.customer),
  validateRequest(bookingValidationSchema),
  BookingControllers.createBooking,
);

router.get(
  '/:id',
  BookingControllers.getSingleBooking,
);

router.patch(
  '/payment-status-update/:id',
  // validateRequest(updateBookingValidationSchema),
  BookingControllers.updatePaymentStatus,
);
router.patch(
  '/:id',
  validateRequest(updateBookingValidationSchema),
  BookingControllers.updateBooking,
);

router.delete(
  '/:id',
  BookingControllers.deleteBooking,
);

router.get(
  '/',
  BookingControllers.getAllBookings,
);
// router.get(
//   '/',
//   BookingControllers.getAllBookingsByUser,
// );

export const BookingRoutes = router;
