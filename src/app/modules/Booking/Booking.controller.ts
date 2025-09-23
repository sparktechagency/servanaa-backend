import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookingServices } from './Booking.service';

const createBooking = catchAsync(async (req, res) => {
  const booking = req.body;
  console.log('Booking: ', booking);
  const result = await BookingServices.createBookingIntoDB(booking, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is created successfully',
    data: result
  });
});

const getSingleBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.getSingleBookingFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is retrieved successfully',
    data: result
  });
});

const getAllBookings = catchAsync(async (req, res) => {
  console.log('=== DEBUGGING BOOKING CREATION ===');
  console.log('Raw req.body:', JSON.stringify(req.body, null, 2));
  console.log('bookingDate field:', req.body.bookingDate);
  console.log('bookingDate type:', typeof req.body.bookingDate);
  console.log('All keys in req.body:', Object.keys(req.body));
  console.log('=====================================');

  const booking = req.body;
  const result = await BookingServices.createBookingIntoDB(booking, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings are retrieved successfully',
    data: result
  });
});

const getAllBookingsByUser = catchAsync(async (req, res) => {
  const result = await BookingServices.getAllBookingsByUserFromDB(
    req.query,
    req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings are retrieved successfully',
    meta: result.meta,
    data: result.result
  });
});

const updateBooking = catchAsync(async (req, res) => {
  const fileUrls = (req.files as Express.MulterS3.File[]).map(f => f.location);

  const { id } = req.params;
  const booking = req.body;
  console.log('test', booking);
  const result = await BookingServices.updateBookingIntoDB(
    id,
    booking,
    fileUrls
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is updated successfully',
    data: result
  });
});
const updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { booking: data } = req.body;
  const result = await BookingServices.updatePaymentStatusIntoDB(id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking payment status is updated successfully',
    data: result
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.deleteBookingFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is deleted successfully',
    data: result
  });
});

// =====================accept booking ==================

const acceptBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  console.log('req.user', id);
  const result = await BookingServices.acceptBookingIntoDB(id, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking accepted successfully',
    data: result
  });
});

const rejectBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const result = await BookingServices.rejectBookingIntoDB(
    id,
    reason,
    req.user
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking rejected successfully',
    data: result
  });
});

const markWorkCompleted = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.markWorkCompletedIntoDB(id, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your booking request has been accepted.',
    data: result
  });
});

const transferPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.transferPaymentIntoDB(id, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment transferred successfully',
    data: result
  });
});

export const BookingControllers = {
  createBooking,
  getSingleBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updatePaymentStatus,

  getAllBookingsByUser,
  acceptBooking,
  rejectBooking,
  markWorkCompleted,
  transferPayment
};
