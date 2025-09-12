import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { BookingServices } from './Booking.service';

const createBooking = catchAsync(async (req, res) => {
  const booking = req.body;
  const result = await BookingServices.createBookingIntoDB(booking, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is created successfully',
    data: result,
  });
});

const getSingleBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.getSingleBookingFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is retrieved successfully',
    data: result,
  });
});

const getAllBookings = catchAsync(async (req, res) => {
  console.log("test",req.query);
  const result = await BookingServices.getAllBookingsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});
const getAllBookingsByUser = catchAsync(async (req, res) => {
  const result = await BookingServices.getAllBookingsByUserFromDB(req.query, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings are retrieved successfully',
    meta: result.meta,
    data: result.result,
  });
});

const updateBooking = catchAsync(async (req, res) => {

     const fileUrls = (req.files as Express.MulterS3.File[]).map(f => f.location); 

  const { id } = req.params;
  const booking = req.body;
  console.log( "test",booking);
  const result = await BookingServices.updateBookingIntoDB(id, booking, fileUrls);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is updated successfully',
    data: result,
  });
});
const updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { booking:data } = req.body;
  const result = await BookingServices.updatePaymentStatusIntoDB(id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking payment status is updated successfully',
    data: result,
  });
});

const deleteBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BookingServices.deleteBookingFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Booking is deleted successfully',
    data: result,
  });
});

export const BookingControllers = {
  createBooking,
  getSingleBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updatePaymentStatus,

  getAllBookingsByUser
};
