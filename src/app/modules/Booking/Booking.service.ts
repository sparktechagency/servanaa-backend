/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { BOOKING_SEARCHABLE_FIELDS } from './Booking.constant';
import { TBooking } from './Booking.interface';
import { Booking } from './Booking.model';
import { MySchedule } from '../MySchedule/MySchedule.model';
import { addOneHour, checkAvailability, createOneTimeBooking, createRecurringBookingIntoDB, generateTimeSlots, getBookingDetails, getDayName } from './Booking.utils';


const createBookingIntoDB = async (payload: TBooking) => {
  const { bookingType, contractorId, day:days } = payload;
  // Step 1: Get booking details (end time, price, rateHourly, etc.)
  const updatedPayload = await getBookingDetails(payload); // Call common function
  // Step 2: Check availability (this will handle both one-time and recurring bookings)
  const result = await checkAvailability(contractorId, updatedPayload.startTime, days, bookingType);
  if (!result?.available) {
      throw new Error('Booking not available');// Reject booking if unavailable
  }

  // Step 3: Create the booking (either one-time or recurring)
  if (bookingType === 'OneTime') {
    const requestedDate = new Date(days as string); // ex: "2025-07-14"
    requestedDate.setUTCHours(0, 0, 0, 0); // normalize to 00:00 UTC
    const dayName = getDayName(days as string); // "Monday"

        updatedPayload.bookingDate = requestedDate;
        updatedPayload.day = dayName;
    const booking = await createOneTimeBooking(updatedPayload); // Create one-time booking
    return booking;
  } else if (bookingType === 'Weekly') {
    const booking = await createRecurringBookingIntoDB(updatedPayload); // Create recurring bookings
    return booking;
  }
};

const checkAvailabilityIntoDB = async (
  contractorId: any,
  startTime: any,
  duration: any,
  days: any,
  bookingType: any,
) => {
  const requestedTimeSlots = generateTimeSlots(
    startTime,
    addOneHour(startTime),
  );

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  for (const day of days) {
    let daySchedule;

    // Convert specific date to day name if one-time booking
    if (bookingType === 'OneTime') {
      const requestedDay = getDayName(day); // Convert to day name
      daySchedule = schedule.schedules.find((s) => s.days === requestedDay);
    } else if (bookingType === 'Weekly') {
      daySchedule = schedule.schedules.find((s) => s.days === day);
    }

    if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot) => !daySchedule.timeSlots.includes(slot),
    );

    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }
  }

  // Check for overlapping bookings for future recurring or one-time slots
  const existingBooking = await Booking.findOne({
    contractorId,
    days: { $in: days }, // This checks if the requested day matches any day in the booking collection
    startTime: { $gte: startTime, $lte: addOneHour(startTime) }, // Compare time range
    status: { $ne: 'cancelled' },
  });

  if (existingBooking) {
    return { available: false, message: 'Time slot is already booked.' };
  }

  return { available: true };
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
  const BookingQuery = new QueryBuilder(Booking.find(), query)
    .search(BOOKING_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await BookingQuery.modelQuery;
  const meta = await BookingQuery.countTotal();
  return {
    result,
    meta,
  };
};

const getSingleBookingFromDB = async (id: string) => {
  const result = await Booking.findById(id);
  return result;
};

const updateBookingIntoDB = async (id: string, payload: any) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new Error('Booking not found');
  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');
  const updatedData = await Booking.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedData) {
    throw new Error('Booking cannot update');
  }

  return updatedData;
};
const updatePaymentStatusIntoDB = async (id: string, payload: any) => {
  const booking = await Booking.findOne({
    clientId: id,
    paymentStatus: 'pending',
  });

  if (!booking) throw new Error('Booking not found');
  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');

  // add new payment status
  const update = { paymentStatus: payload.paymentStatus };
  const updatedData = await Booking.findByIdAndUpdate(
    { _id: booking._id },
    update,
    { new: true, runValidators: true },
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

export const BookingServices = {
  createBookingIntoDB,
  getAllBookingsFromDB,
  getSingleBookingFromDB,
  updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB,
  checkAvailabilityIntoDB,
  // getAllBookingsByUserFromDB
};
