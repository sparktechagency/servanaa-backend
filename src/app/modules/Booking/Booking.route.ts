import express from 'express';
import { BookingControllers } from './Booking.controller';
import validateRequest from '../../middlewares/validateRequest';
import { bookingValidationSchema, updateBookingValidationSchema } from './Booking.validation';

const router = express.Router();

router.post(
  '/create-booking',
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
