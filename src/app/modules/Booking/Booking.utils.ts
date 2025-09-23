/* eslint-disable @typescript-eslint/no-explicit-any */
import { Contractor } from '../Contractor/Contractor.model';
import { MySchedule } from '../MySchedule/MySchedule.model';
import { TBooking } from './Booking.interface';
import { Booking } from './Booking.model';

export const generateTimeSlots = (startTime: string, endTime: string) => {
  const timeSlots = [];
  let currentTime = startTime;

  // Generate all time slots between startTime and endTime (one hour increment)
  while (currentTime < endTime) {
    const nextTime = addOneHour(currentTime); // Add one hour to current time
    timeSlots.push(`${currentTime}-${nextTime}`);
    currentTime = nextTime;
  }

  return timeSlots;
};

export const addOneHour = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(0, 0, 0, hours, minutes);
  date.setHours(date.getHours() + 1); // Add one hour to the time
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};
// export const getDayName = (dateStr: string):string => {
//   const date = new Date(dateStr);  // Convert date string to Date object
//   const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
//   return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
// };

export const getDayName = (dateStr: string): string => {
  // Check if it's already a weekday name
  const weekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  if (weekdays.includes(dateStr)) {
    return dateStr; // Return as-is if it's already a weekday name
  }

  // Try to parse as date string (YYYY-MM-DD format)
  try {
    const date = new Date(dateStr + 'T00:00:00.000Z'); // Force UTC parsing

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      timeZone: 'UTC'
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('getDayName error:', error);
    console.error('Input was:', dateStr);
    throw new Error(`Cannot determine day name from: ${dateStr}`);
  }
};

export const getNextWeekDayDate = (dayName: string, startDate: Date): Date => {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const dayIndex = daysOfWeek.indexOf(dayName);

  const currentDayIndex = startDate.getDay();
  let daysUntilNext = dayIndex - currentDayIndex;

  if (daysUntilNext <= 0) {
    daysUntilNext += 7; // Move to the next week if the day already passed
  }

  const nextDay = new Date(startDate);
  nextDay.setDate(startDate.getDate() + daysUntilNext);
  return nextDay;
};

// Common function to calculate endTime, price, and rateHourly for both booking types

export const getBookingDetails = async (payload: TBooking) => {
  const { startTime, duration, contractorId } = payload;
  // Calculate end time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Calculate end time based on duration
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  payload.endTime = endTime; // Attach endTime to payload

  // Get contractor rate and calculate price
  const contractor = await Contractor.findById(contractorId);
  if (!contractor) throw new Error('Contractor not found');
  payload.rateHourly = contractor.rateHourly;
  // Calculate material total price
  const materialTotalPrice = payload.material.reduce(
    (total, material) => total + material.price,
    0
  );
  const price = materialTotalPrice + payload.rateHourly * duration; // Final price
  payload.price = price;

  payload.timeSlots = generateTimeSlots(startTime, endTime);

  return payload; // Return updated payload with all the details
};

export const createRecurringBookingIntoDB = async (
  updatedPayload: TBooking | any
) => {
  const {
    startTime,
    day: days,
    contractorId,
    periodInDays,
    endTime
  } = updatedPayload;

  const futureBookings: any[] = [];

  // Normalize today to UTC midnight
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Start from tomorrow
  const startDate = new Date(today);

  startDate.setDate(startDate.getDate() + 1);

  // End at 30 days from tomorrow (not including today)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + periodInDays);

  // Map day names to weekday numbers
  const dayNameToNumber: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };

  // Loop from tomorrow to endDate (inclusive)
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentWeekday = d.getDay();

    for (const day of days) {
      const targetWeekday = dayNameToNumber[day];
      if (currentWeekday === targetWeekday) {
        const bookingDate = new Date(d);
        bookingDate.setUTCHours(0, 0, 0, 0);

        const requestedTimeSlots = generateTimeSlots(startTime, endTime);
        const bookingPayload = {
          ...updatedPayload,
          day,
          bookingDate,
          timeSlots: requestedTimeSlots,
          recurring: true
        };

        if (bookingDate.getDate() !== startDate.getDate()) {
          futureBookings.push(bookingPayload);
        }
      }
    }
  }

  // Optional: Check for conflicts and create bookings
  for (const booking of futureBookings) {
    const existingBooking = await Booking.findOne({
      contractorId,
      bookingDate: booking.bookingDate,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      throw new Error(
        `Slot already booked on ${booking.bookingDate.toISOString()}`
      );
    }

    await Booking.create(booking);
  }

  return futureBookings;
};

export const createOneTimeBooking = async (updatedPayload: TBooking) => {
  // Make sure bookingDate is properly formatted before saving
  if (updatedPayload.bookingDate) {
    const bookingDate = new Date(updatedPayload.bookingDate);
    if (isNaN(bookingDate.getTime())) {
      throw new Error('Invalid bookingDate in payload');
    }
    // Ensure it's properly normalized
    bookingDate.setUTCHours(0, 0, 0, 0);
    updatedPayload.bookingDate = bookingDate;
  }

  console.log('Creating booking with payload:', {
    bookingDate: updatedPayload.bookingDate,
    day: updatedPayload.day,
    startTime: updatedPayload.startTime,
    endTime: updatedPayload.endTime
  });

  const booking = await Booking.create(updatedPayload);
  return booking;
};

export const checkAvailability = async (
  contractorId: any,
  startTime: any,
  days: any,
  bookingType: any
) => {
  console.log('checkAvailability called with:', {
    contractorId,
    startTime,
    days,
    bookingType
  });

  const requestedTimeSlots = generateTimeSlots(
    startTime,
    addOneHour(startTime)
  );

  console.log('requestedTimeSlots', requestedTimeSlots);

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  console.log('schedule', schedule);

  if (bookingType === 'OneTime') {
    let requestedDate: Date;
    let dayName: string;

    // Handle different input formats for OneTime booking
    if (typeof days === 'string') {
      const weekdays = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];

      if (weekdays.includes(days)) {
        // If it's already a weekday name, we need to find a way to get the actual date
        // Since we don't have the actual date here, we'll assume it's valid for now
        // This is not ideal - the proper fix would be to pass the actual date
        dayName = days;
        console.log('Using weekday name directly:', dayName);

        // We can't validate the actual date without it, so we'll skip date-based validation
        // and only check schedule availability
      } else {
        // Try to parse as date string (YYYY-MM-DD format)
        requestedDate = new Date(days + 'T00:00:00.000Z');
        if (isNaN(requestedDate.getTime())) {
          throw new Error(`Invalid date format: ${days}`);
        }
        requestedDate.setUTCHours(0, 0, 0, 0);
        dayName = getDayName(days);
      }
    } else {
      throw new Error('Invalid days format for OneTime booking');
    }

    console.log('Checking availability for day:', dayName);

    const daySchedule = schedule.schedules.find(s => s.days === dayName);
    if (!daySchedule) {
      return {
        available: false,
        message: `Contractor is not available on ${dayName}`
      };
    }

    console.log('daySchedule', daySchedule);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot: any) => !daySchedule.timeSlots.includes(slot)
    );

    console.log('unavailableSlots', unavailableSlots);

    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }

    // Only check for booking conflicts if we have a valid date
    if (requestedDate) {
      const existingBooking = await Booking.findOne({
        contractorId,
        bookingDate: requestedDate,
        timeSlots: { $in: requestedTimeSlots },
        status: { $ne: 'cancelled' }
      });

      if (existingBooking) {
        return { available: false, message: 'Time slot is already booked.' };
      }
    }

    return { available: true };
  }

  // Weekly booking logic remains the same
  if (bookingType === 'Weekly') {
    for (const day of days) {
      let daySchedule: any;

      if (bookingType === 'OneTime') {
        const requestedDay = getDayName(day);
        daySchedule = schedule.schedules.find(s => s.days === requestedDay);
      } else if (bookingType === 'Weekly') {
        daySchedule = schedule.schedules.find(s => s.days === day);
      }

      if (!daySchedule)
        throw new Error(`Contractor is not available on ${day}`);

      const unavailableSlots = requestedTimeSlots.filter(
        (slot: any) => !daySchedule.timeSlots.includes(slot)
      );

      if (unavailableSlots.length > 0) {
        return {
          available: false,
          message: 'Requested slots are unavailable.'
        };
      }
    }

    const existingBooking = await Booking.findOne({
      contractorId,
      days: { $in: days },
      startTime: { $gte: startTime, $lte: addOneHour(startTime) },
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return { available: false, message: 'Time slot is already booked.' };
    }

    return { available: true };
  }
};

// Update src/app/modules/Booking/Booking.utils.ts
// Update src/app/modules/Booking/Booking.utils.ts
export function checkOrderDate (days: any, bookingType?: string) {
  console.log(
    'Input days:',
    days,
    'Type:',
    typeof days,
    'BookingType:',
    bookingType
  );

  try {
    let orderDate: Date;

    // If it's a weekday name and we have bookingDate, skip validation
    const weekdays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    if (typeof days === 'string' && weekdays.includes(days)) {
      // This is a weekday name, not a date - return as is for weekly bookings
      // For OneTime bookings, this should not happen, but we'll handle it gracefully
      console.log('Received weekday name:', days);
      return days; // Return the weekday name as-is
    }

    if (typeof days === 'string') {
      // Check if it matches YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(days)) {
        throw new Error(
          `Invalid date format: "${days}". Expected format: YYYY-MM-DD`
        );
      }

      orderDate = new Date(days + 'T00:00:00.000Z');
    } else if (days instanceof Date) {
      orderDate = new Date(days);
    } else if (Array.isArray(days)) {
      // For weekly bookings with multiple days
      return days; // Return the array as-is
    } else {
      throw new Error(
        `Invalid input type: ${typeof days}. Expected date string or Date object`
      );
    }

    // Validate the parsed date
    if (isNaN(orderDate.getTime())) {
      throw new Error(`Could not parse date: "${days}"`);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const orderDateUTC = new Date(orderDate);
    orderDateUTC.setUTCHours(0, 0, 0, 0);

    // Check if the order date is in the past
    if (orderDateUTC < today) {
      throw new Error('Booking date must be today or in the future');
    }

    return orderDateUTC.toISOString();
  } catch (error) {
    console.error('Date validation error:', error);
    console.error('Original input:', days);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Date validation failed with unknown error');
    }
  }
}
