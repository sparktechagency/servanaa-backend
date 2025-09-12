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
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const getNextWeekDayDate = (dayName: string, startDate: Date): Date => {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
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
    0,
  );
  const price = materialTotalPrice + payload.rateHourly * duration; // Final price
  payload.price = price;

  payload.timeSlots = generateTimeSlots(startTime, endTime);

  return payload; // Return updated payload with all the details
};

export const createRecurringBookingIntoDB = async (
  updatedPayload: TBooking | any,
) => {
  const {
    startTime,
    day: days,
    contractorId,
    periodInDays,
    endTime,
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
    Saturday: 6,
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
          recurring: true,
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
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      throw new Error(
        `Slot already booked on ${booking.bookingDate.toISOString()}`,
      );
    }

    await Booking.create(booking);
  }

  return futureBookings;
};

export const createOneTimeBooking = async (updatedPayload: TBooking) => {
  // Logic to create a one-time booking (insert into DB)
  const booking = await Booking.create(updatedPayload);
  return booking;
};

export const checkAvailability = async (
  contractorId: any,
  startTime: any,
  days: any,
  bookingType: any,
) => {

console.log('checkAvailability called with:', contractorId, startTime, days, bookingType );

  const requestedTimeSlots = generateTimeSlots(
    startTime,
    addOneHour(startTime),
  );

  console.log('requestedTimeSlots', requestedTimeSlots);

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  console.log('schedule', schedule);

  if (bookingType === 'OneTime') {
    const requestedDate = new Date(days as string); // ex: "2025-07-14"
    requestedDate.setUTCHours(0, 0, 0, 0); // normalize to 00:00 UTC
    const dayName = getDayName(days as string); // "Monday"
    
    console.log('requestedDate', requestedDate, 'dayName', dayName);
    
    const daySchedule = schedule.schedules.find((s) => s.days === dayName);
    if (!daySchedule) {
      return {
        available: false,
        message: `Contractor is not available on ${dayName}`,
      };
    }

    console.log('daySchedule', daySchedule);


    const unavailableSlots = requestedTimeSlots.filter(
      (slot:any) => !daySchedule.timeSlots.includes(slot),
    );

        console.log('unavailableSlots', unavailableSlots );


    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }

    // ✅ Duplicate check using date and time slot match
    const existingBooking = await Booking.findOne({
      contractorId,
      bookingDate: requestedDate, // must match exactly (normalized date)
      timeSlots: { $in: requestedTimeSlots }, // any overlap
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      return { available: false, message: 'Time slot is already booked.' };
    }

    return { available: true };
  }

  if (bookingType === 'Weekly') {
    for (const day of days) {
      let daySchedule:any;

      // Convert specific date to day name if one-time booking
      if (bookingType === 'OneTime') {
        const requestedDay = getDayName(day); // Convert to day name
        daySchedule = schedule.schedules.find((s) => s.days === requestedDay);
      } else if (bookingType === 'Weekly') {
        daySchedule = schedule.schedules.find((s) => s.days === day);
      }

      if (!daySchedule)
        throw new Error(`Contractor is not available on ${day}`);

      const unavailableSlots = requestedTimeSlots.filter(
        (slot:any) => !daySchedule.timeSlots.includes(slot),
      );

      if (unavailableSlots.length > 0) {
        return {
          available: false,
          message: 'Requested slots are unavailable.',
        };
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
  }
};
