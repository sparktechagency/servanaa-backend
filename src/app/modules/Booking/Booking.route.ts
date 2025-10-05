import express, { NextFunction, Request, Response } from 'express';
import { BookingControllers } from './Booking.controller';
// import { bookingValidationSchema, updateBookingValidationSchema } from './Booking.validation';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import { uploadFileS3 } from '../../utils/UploaderS3';

const router = express.Router();

router.post(
  '/create-booking',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer),
  BookingControllers.createBooking
);

router.get(
  '/all-bookings-by-user',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  BookingControllers.getAllBookingsByUser
);

router.get(
  '/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  BookingControllers.getSingleBooking
);

router.patch(
  '/payment-status-update/:id',
  auth(USER_ROLE.superAdmin, USER_ROLE.customer, USER_ROLE.contractor),
  // validateRequest(updateBookingValidationSchema),
  BookingControllers.updatePaymentStatus
);

router.patch(
  '/:id',
  uploadFileS3(true).array('file', 5),
  //  uploadFileS3(true).single('file'),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        next(error);
      }
    }
    next();
  },
  // validateRequest(updateBookingValidationSchema),
  BookingControllers.updateBooking
);

router.delete('/:id', BookingControllers.deleteBooking);

router.get(
  '/',
  //  auth(USER_ROLE.superAdmin , USER_ROLE.customer, USER_ROLE.contractor),
  BookingControllers.getAllBookings
);

// router.patch(
//   '/accept/:id',
//   auth(USER_ROLE.contractor),
//   BookingControllers.acceptBooking
// );

// router.patch(
//   '/reject/:id',
//   auth(USER_ROLE.contractor),
//   BookingControllers.rejectBooking
// );

// router.patch(
//   '/complete/:id',
//   auth(USER_ROLE.customer),
//   BookingControllers.markWorkCompleted
// );

// router.patch(
//   '/transfer-payment/:id',
//   auth(USER_ROLE.superAdmin),
//   BookingControllers.transferPayment
// );

export const BookingRoutes = router;
