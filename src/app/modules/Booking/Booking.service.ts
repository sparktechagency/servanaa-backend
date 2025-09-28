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
import { Contractor } from '../Contractor/Contractor.model';
import { Customer } from '../Customer/Customer.model';

const createBookingIntoDB = async (payload: TBooking, usr: any) => {
  console.log('=== SERVICE LEVEL DEBUG ===');
  console.log('Received payload:', JSON.stringify(payload, null, 2));
  console.log('bookingDate in payload:', payload.bookingDate);
  console.log('User:', usr);
  console.log('==========================');

  // Validate required fields
  if (!payload.contractorId) {
    throw new Error('Contractor ID is required');
  }

  if (!payload.customerId) {
    throw new Error('Customer ID is required');
  }

  if (!payload.startTime) {
    throw new Error('Start time is required');
  }

  if (!payload.duration) {
    throw new Error('Duration is required');
  }

  if (!payload.bookingType) {
    throw new Error('Booking type is required');
  }

  // Validate booking type
  if (!['oneTime', 'weekly'].includes(payload.bookingType)) {
    throw new Error('Invalid booking type. Must be "oneTime" or "weekly"');
  }

  const { bookingType, contractorId, day: days, bookingDate } = payload;

  // Handle oneTime booking
  if (bookingType === 'oneTime') {
    console.log('Processing oneTime booking...');

    // Determine the actual booking date
    let actualBookingDate = bookingDate;

    if (!actualBookingDate) {
      // If bookingDate is missing, try to construct it from the day field
      if (typeof days === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(days)) {
        actualBookingDate = new Date(days + 'T00:00:00.000Z');
        console.log(
          'Constructed bookingDate from day field:',
          actualBookingDate
        );
      } else {
        throw new Error(
          'For oneTime bookings, either bookingDate or day in YYYY-MM-DD format is required'
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
    console.log('Date string for validation:', dateString);

    // Check if the order date is valid
    try {
      checkOrderDate(dateString, bookingType);
    } catch (error) {
      console.error('Date validation failed:', error);
      throw error;
    }

    // Get booking details with proper calculations
    let updatedPayload: TBooking;
    try {
      updatedPayload = await getBookingDetails(payload);
      console.log('Updated payload after getBookingDetails:', updatedPayload);
    } catch (error) {
      console.error('Error getting booking details:', error);
      throw error;
    }

    // Check availability
    const availabilityResult = await checkAvailability(
      contractorId,
      updatedPayload.startTime,
      dateString,
      bookingType
    );

    console.log('Availability check result:', availabilityResult);

    if (!availabilityResult?.available) {
      throw new Error(availabilityResult?.message || 'Booking not available');
    }

    // Set the proper values for oneTime booking
    const requestedDate = new Date(actualBookingDate);
    requestedDate.setUTCHours(0, 0, 0, 0);
    const dayName = getDayName(dateString);

    // Update the payload with correct date and day
    updatedPayload.bookingDate = requestedDate;
    updatedPayload.day = dayName;

    console.log('Final payload before creating booking:', {
      bookingDate: updatedPayload.bookingDate,
      day: updatedPayload.day,
      startTime: updatedPayload.startTime,
      endTime: updatedPayload.endTime,
      price: updatedPayload.price
    });

    // Create the booking
    let booking: any;
    try {
      booking = await createOneTimeBooking(updatedPayload);
      console.log('Booking created successfully:', booking._id);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    if (!booking) {
      throw new Error('Failed to create booking');
    }

      const customerData = await Customer.findById(booking.customerId);
      if(!customerData) throw new Error('No customer found');
      customerData.balance = (customerData.balance || 0) + (booking.price || 0);
      await customerData.save();

    // Create notifications
    const notifications = [];

    // Notification for contractor
    notifications.push({
      userId: booking.contractorId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_REQUEST,
      title: 'New Booking Request',
      message: `New ${bookingType} booking request received for ${dayName}`,
      bookingId: booking._id.toString(),
      isRead: []
    });

    // Notifications for admins
    try {
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
    } catch (error) {
      console.error('Error fetching admins for notifications:', error);
      // Don't throw error here, just log it as notifications are not critical
    }

    // Create all notifications
    for (const notification of notifications) {
      try {
        await NotificationServices.createNotificationIntoDB(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        // Continue with other notifications even if one fails
      }
    }

    console.log('OneTime booking process completed successfully');
    return booking;
  }

  // Handle weekly booking
  else if (bookingType === 'weekly') {
    console.log('Processing weekly booking...');

    // Validate days for weekly booking
    if (!days || (typeof days === 'string' && !Array.isArray(days))) {
      throw new Error('Days are required for weekly bookings');
    }

    const daysArray = Array.isArray(days) ? days : [days];

    // Validate each day
    for (const day of daysArray) {
      try {
        checkOrderDate(day, bookingType);
      } catch (error) {
        console.error(`Date validation failed for day ${day}:`, error);
        throw error;
      }
    }

    // Get booking details
    let updatedPayload: TBooking;
    try {
      updatedPayload = await getBookingDetails(payload);
      console.log('Updated payload for weekly booking:', updatedPayload);
    } catch (error) {
      console.error('Error getting booking details for weekly:', error);
      throw error;
    }

    // Check availability for all days
    for (const day of daysArray) {
      const availabilityResult = await checkAvailability(
        contractorId,
        updatedPayload.startTime,
        day,
        bookingType
      );

      console.log(`Availability check result for ${day}:`, availabilityResult);

      if (!availabilityResult?.available) {
        throw new Error(
          availabilityResult?.message || `Booking not available for ${day}`
        );
      }
    }

    // Create recurring bookings
    let bookings: any[];
    try {
      bookings = await createRecurringBookingIntoDB(updatedPayload);
      console.log(`Created ${bookings.length} recurring bookings`);
    } catch (error) {
      console.error('Error creating recurring bookings:', error);
      throw error;
    }

    // Create notifications for weekly booking
    if (bookings && bookings.length > 0) {
      const notifications = [];

      // Notification for contractor
      notifications.push({
        userId: bookings[0].contractorId.toString(),
        type: NOTIFICATION_TYPES.BOOKING_REQUEST,
        title: 'New Weekly Booking Request',
        message: `New ${bookingType} booking request received for ${daysArray.join(
          ', '
        )}`,
        bookingId: bookings[0]._id ? bookings[0]._id.toString() : '',
        isRead: []
      });

      // Notifications for admins
      try {
        const admins = await User.find({ role: 'superAdmin' });
        for (const admin of admins) {
          notifications.push({
            userId: admin._id.toString(),
            type: NOTIFICATION_TYPES.BOOKING_REQUEST,
            title: 'New Weekly Booking Request',
            message: `New weekly booking request from customer requires attention`,
            bookingId: bookings[0]._id ? bookings[0]._id.toString() : '',
            isRead: []
          });
        }
      } catch (error) {
        console.error('Error fetching admins for weekly notifications:', error);
      }

      // Create all notifications
      for (const notification of notifications) {
        try {
          await NotificationServices.createNotificationIntoDB(notification);
        } catch (error) {
          console.error('Error creating weekly notification:', error);
        }
      }
    }

    console.log('Weekly booking process completed successfully');
    return bookings;
  }

  // Invalid booking type
  throw new Error(
    `Invalid booking type: ${bookingType}. Must be "oneTime" or "weekly"`
  );
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
    // Fix: Change 'OneTime' to 'oneTime'
    if (bookingType === 'oneTime') {
      const requestedDay = getDayName(day); // Convert to day name
      daySchedule = schedule.schedules.find(
        (s: any) => s.days === requestedDay
      );
    }
    // Fix: Change 'Weekly' to 'weekly'
    else if (bookingType === 'weekly') {
      daySchedule = schedule.schedules.find((s: any) => s.days === day);
    }

    if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot: string) => !daySchedule.timeSlots.includes(slot)
    );

    console.log('unavailableSlotsmm', unavailableSlots);

    if (unavailableSlots.length === 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }
  }

  // Check for overlapping bookings for future recurring or one-time slots
  const existingBooking = await Booking.findOne({
    contractorId,
    day: { $in: days }, // This checks if the requested day matches any day in the booking collection
    startTime: { $gte: startTime, $lte: addOneHour(startTime) }, // Compare time range
    status: { $ne: 'cancelled' }
  });

  if (existingBooking) {
    return { available: false, message: 'Time slot is already booked.' };
  }

  return { available: true };
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
 console.log('getAllBookingsFromDB query:', query);

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

  if (files && files.length > 0) {
    // const fileUrls = files.map((file: any) => file.location); // Extract S3 URLs
    payload.files = files; // Assuming file.location contains the S3 URL
  }

  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');



  const updatedData = await Booking.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true
  });
 if (!updatedData) {
    throw new Error('Booking cannot update');
  }
  if(updatedData?.status === 'completed'){
      console.log('completed');
      // Notify contractor of payment transfer

      const contractorData = await Contractor.findById(updatedData.contractorId);
      const customerData = await Customer.findById(updatedData.customerId);
      if(!customerData) throw new Error('No customer found');
      if(!contractorData) throw new Error('No contractor found');

      contractorData.balance = (contractorData.balance || 0) + (updatedData.price || 0);
      customerData.balance = (customerData?.balance ?? 0) - (updatedData.price || 0);
      await contractorData.save();
      await customerData.save();


      await NotificationServices.createNotificationIntoDB({
        userId: updatedData.customerId,
        type: NOTIFICATION_TYPES.WORK_COMPLETED,
        title: 'Work Completed',
        message: 'Your work has been marked as completed',
        bookingId: updatedData._id,
        isRead: []
      });
  }

    if(updatedData?.status === 'ongoing'){
      // console.log('completed');
      // Notify contractor of payment transfer

      // const contractorData = await Contractor.findById(updatedData.contractorId);
      // if(!contractorData) throw new Error('No contractor found');
      // contractorData.balance = (contractorData.balance || 0) + (updatedData.price || 0);
      // await contractorData.save();


      await NotificationServices.createNotificationIntoDB({
        userId: updatedData.customerId,
        type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
        title: 'Work Accepted',
        message: 'Your work has been Started',
        bookingId: updatedData._id,
        isRead: []
      });
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
