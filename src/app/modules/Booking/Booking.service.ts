/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { BOOKING_SEARCHABLE_FIELDS } from './Booking.constant';
import { DaySchedule, TBooking } from './Booking.interface';
import { Booking } from './Booking.model';
import { MySchedule } from '../MySchedule/MySchedule.model';
import {
  addOneHour,
  checkAvailability,
  checkOrderDate,
  createOneTimeBooking,
  createRecurringBookingIntoDB,
  generateTimeSlots,
  getBookingDetails,
  getDayName
} from './Booking.utils';
import { User } from '../User/user.model';
import { NotificationServices } from '../Notification/Notification.service';
import { NOTIFICATION_TYPES } from '../Notification/Notification.constant';

const createBookingIntoDB = async (payload: TBooking, usr: any) => {
  console.log('=== SERVICE LEVEL DEBUG ===');
  console.log('Received payload:', JSON.stringify(payload, null, 2));
  console.log('bookingDate in payload:', payload.bookingDate);
  console.log('==========================');

  const { bookingType, contractorId, day: days, bookingDate } = payload;

  if (bookingType === 'OneTime') {
    // If bookingDate is missing, try to construct it from the day field
    let actualBookingDate = bookingDate;

    if (!actualBookingDate) {
      // If bookingDate is missing, but we have day as a date string, use that
      if (typeof days === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(days)) {
        actualBookingDate = new Date(days + 'T00:00:00.000Z');
        console.log(
          'Constructed bookingDate from day field:',
          actualBookingDate
        );
      } else {
        // If we only have weekday name, we can't proceed without actual date
        throw new Error(
          'For OneTime bookings, either bookingDate or day in YYYY-MM-DD format is required'
        );
      }
    }

    // Validate the bookingDate
    const bookingDateObj = new Date(actualBookingDate);
    if (isNaN(bookingDateObj.getTime())) {
      throw new Error('Invalid bookingDate provided');
    }

    // Use bookingDate for validation
    const dateString = bookingDateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    checkOrderDate(dateString, bookingType);

    const updatedPayload = await getBookingDetails(payload);
    const result = await checkAvailability(
      contractorId,
      updatedPayload.startTime,
      dateString,
      bookingType
    );

    if (!result?.available) {
      throw new Error('Booking not available');
    }

    // Set the proper values for OneTime booking
    const requestedDate = new Date(actualBookingDate);
    requestedDate.setUTCHours(0, 0, 0, 0);
    const dayName = getDayName(dateString);

    updatedPayload.bookingDate = requestedDate;
    updatedPayload.day = dayName;

    const booking = await createOneTimeBooking(updatedPayload);

    // Create notifications
    const notifications = [];

    notifications.push({
      userId: booking.contractorId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_REQUEST,
      title: 'New Booking Request',
      message: `New ${bookingType} booking request received`,
      bookingId: booking._id.toString(),
      isRead: []
    });

    const admins = await User.find({ role: 'superAdmin' });
    for (const admin of admins) {
      notifications.push({
        userId: admin._id.toString(),
        type: NOTIFICATION_TYPES.BOOKING_REQUEST,
        title: 'New Booking Request',
        message: `New booking request from customer requires attention`,
        bookingId: booking._id.toString(),
        isRead: []
      });
    }

    for (const notification of notifications) {
      await NotificationServices.createNotificationIntoDB(notification);
    }

    return booking;
  } else if (bookingType === 'Weekly') {
    // Weekly booking logic remains the same
    checkOrderDate(days, bookingType);
    const updatedPayload = await getBookingDetails(payload);
    const result = await checkAvailability(
      contractorId,
      updatedPayload.startTime,
      days,
      bookingType
    );

    if (!result?.available) {
      throw new Error('Booking not available');
    }

    const booking = await createRecurringBookingIntoDB(updatedPayload);

    // Create notifications for weekly booking
    if (booking && booking.length > 0) {
      const notifications = [];

      notifications.push({
        userId: booking[0].contractorId.toString(),
        type: NOTIFICATION_TYPES.BOOKING_REQUEST,
        title: 'New Booking Request',
        message: `New ${bookingType} booking request received`,
        bookingId: booking[0]._id ? booking[0]._id.toString() : '',
        isRead: []
      });

      const admins = await User.find({ role: 'superAdmin' });
      for (const admin of admins) {
        notifications.push({
          userId: admin._id.toString(),
          type: NOTIFICATION_TYPES.BOOKING_REQUEST,
          title: 'New Booking Request',
          message: `New booking request from customer requires attention`,
          bookingId: booking[0]._id ? booking[0]._id.toString() : '',
          isRead: []
        });
      }

      for (const notification of notifications) {
        await NotificationServices.createNotificationIntoDB(notification);
      }
    }

    return booking;
  }

  throw new Error('Invalid booking type');
};

const checkAvailabilityIntoDB = async (
  contractorId: any,
  startTime: any,
  duration: any,
  days: any,
  bookingType: any
) => {
  const requestedTimeSlots = generateTimeSlots(
    startTime,
    addOneHour(startTime)
  );

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  for (const day of days) {
    let daySchedule: any;

    // Convert specific date to day name if one-time booking
    if (bookingType === 'OneTime') {
      const requestedDay = getDayName(day); // Convert to day name
      daySchedule = schedule.schedules.find(s => s.days === requestedDay);
    } else if (bookingType === 'Weekly') {
      daySchedule = schedule.schedules.find(s => s.days === day);
    }

    if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

    const unavailableSlots = requestedTimeSlots.filter(
      slot => !daySchedule.timeSlots.includes(slot)
    );

    console.log('unavailableSlotsmm', unavailableSlots);

    if (unavailableSlots.length === 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }
  }

  // Check for overlapping bookings for future recurring or one-time slots
  const existingBooking = await Booking.findOne({
    contractorId,
    days: { $in: days }, // This checks if the requested day matches any day in the booking collection
    startTime: { $gte: startTime, $lte: addOneHour(startTime) }, // Compare time range
    status: { $ne: 'cancelled' }
  });

  if (existingBooking) {
    return { available: false, message: 'Time slot is already booked.' };
  }

  return { available: true };
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
  const BookingQuery = new QueryBuilder(
    Booking.find()
      .populate({
        path: 'contractorId', // Populate contractorId
        populate: {
          path: 'contractor', // Populate contractor field inside contractorId
          select: 'ratings rateHourly' // Specify the fields you want from contractor
        }
      })
      .populate('subCategoryId', 'name'),
    query
  )
    .search(BOOKING_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await BookingQuery.modelQuery;
  const meta = await BookingQuery.countTotal();

  console.log('result=========', result);

  return {
    result,
    meta
  };
};
const getAllBookingsByUserFromDB = async (
  query: Record<string, unknown>,
  user: any
) => {
  console.log('ahmad Musa');

  const usr = await User.findOne({ email: user.userEmail }).select('_id role');
  // console.log('usr', usr)
  const b: any = {};

  if (user.role === 'customer') {
    b.customerId = usr?._id;
  }

  if (user.role === 'contractor') {
    b.contractorId = usr?._id;
  }

  const BookingQuery = new QueryBuilder(
    Booking.find(b)
      .populate('customerId')
      .populate('contractorId')
      .populate('subCategoryId'),
    query
  )
    .search(BOOKING_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await BookingQuery.modelQuery;
  const meta = await BookingQuery.countTotal();
  return {
    result,
    meta
  };
};

const getSingleBookingFromDB = async (id: string) => {
  const result = await Booking.findById(id).populate(
    'contractorId subCategoryId'
  );
  return result;
};

const updateBookingIntoDB = async (id: string, payload: any, files?: any) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new Error('Booking not found');

  console.log('files', files);
  if (files && files.length > 0) {
    // const fileUrls = files.map((file: any) => file.location); // Extract S3 URLs
    payload.files = files; // Assuming file.location contains the S3 URL
  }

  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');
  const updatedData = await Booking.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true
  });
  console.log('updatedData', updatedData);

  if (!updatedData) {
    throw new Error('Booking cannot update');
  }

  return updatedData;
};
const updatePaymentStatusIntoDB = async (id: string, payload: any) => {
  const booking = await Booking.findOne({
    clientId: id,
    paymentStatus: 'pending'
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');

  // add new payment status
  const update = { paymentStatus: payload.paymentStatus };
  const updatedData = await Booking.findByIdAndUpdate(
    { _id: booking._id },
    update,
    { new: true, runValidators: true }
  );

  return updatedData;
};
const deleteBookingFromDB = async (id: string) => {
  const deletedService = await Booking.findByIdAndDelete(id, { new: true });

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Booking');
  }

  return deletedService;
};

// =============================added by rakib==========================

// Accept booking (Contractor only)
const acceptBookingIntoDB = async (id: string, contractorUser: any) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status: 'accepted' },
    { new: true }
  );

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  // Notify customer of acceptance
  await NotificationServices.createNotificationIntoDB({
    userId: booking.customerId,
    type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
    title: 'Booking Accepted',
    message: 'Your booking request has been accepted by the contractor',
    bookingId: booking._id,
    isRead: []
  });

  return booking;
};

// Reject booking (Contractor only)
const rejectBookingIntoDB = async (
  id: string,
  reason: string,
  contractorUser: any
) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status: 'rejected' },
    { new: true }
  );

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  // Notify customer of rejection
  await NotificationServices.createNotificationIntoDB({
    userId: booking.customerId,
    type: NOTIFICATION_TYPES.BOOKING_REJECTED,
    title: 'Booking Rejected',
    message: `Your booking request was rejected. Reason: ${reason}`,
    bookingId: booking._id,
    isRead: []
  });

  return booking;
};

// Mark work completed (Customer only)
const markWorkCompletedIntoDB = async (id: string, customerUser: any) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status: 'completed' },
    { new: true }
  );

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  // Notify all admins for payment processing
  const admins = await User.find({ role: 'superAdmin' });

  for (const admin of admins) {
    await NotificationServices.createNotificationIntoDB({
      userId: admin._id,
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      message: 'Customer marked work as completed - ready for payment transfer',
      bookingId: booking._id,
      isRead: []
    });
  }

  return booking;
};

// Transfer payment (Admin only)
const transferPaymentIntoDB = async (id: string, adminUser: any) => {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { paymentStatus: 'paid' },
    { new: true }
  );

  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

  // Notify contractor of payment transfer
  await NotificationServices.createNotificationIntoDB({
    userId: booking.contractorId,
    type: NOTIFICATION_TYPES.PAYMENT_TRANSFERRED,
    title: 'Payment Transferred',
    message: 'Payment for completed work has been transferred to your account',
    bookingId: booking._id,
    isRead: []
  });

  return booking;
};

export const BookingServices = {
  createBookingIntoDB,
  getAllBookingsFromDB,
  getSingleBookingFromDB,
  updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB,
  checkAvailabilityIntoDB,
  getAllBookingsByUserFromDB,
  acceptBookingIntoDB,
  rejectBookingIntoDB,
  markWorkCompletedIntoDB,
  transferPaymentIntoDB
};
