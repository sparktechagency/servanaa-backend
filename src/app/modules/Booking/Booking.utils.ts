// // src/app/modules/Booking/Booking.utils.ts
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Contractor } from '../Contractor/Contractor.model';
// import { MySchedule } from '../MySchedule/MySchedule.model';
// import { TBooking } from './Booking.interface';
// import { Booking } from './Booking.model';

// export const generateTimeSlots = (startTime: string, endTime: string) => {
//   const timeSlots = [];
//   let currentTime = startTime;

//   // Generate all time slots between startTime and endTime (one hour increment)
//   while (currentTime < endTime) {
//     const nextTime = addOneHour(currentTime); // Add one hour to current time
//     timeSlots.push(`${currentTime}-${nextTime}`);
//     currentTime = nextTime;
//   }

//   return timeSlots;
// };

// export const addOneHour = (time: string) => {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date(0, 0, 0, hours, minutes);
//   date.setHours(date.getHours() + 1); // Add one hour to the time
//   return `${date.getHours().toString().padStart(2, '0')}:${date
//     .getMinutes()
//     .toString()
//     .padStart(2, '0')}`;
// };

// export const getDayName = (dateStr: string): string => {
//   // Check if it's already a weekday name
//   const weekdays = [
//     'Sunday',
//     'Monday',
//     'Tuesday',
//     'Wednesday',
//     'Thursday',
//     'Friday',
//     'Saturday'
//   ];

//   if (weekdays.includes(dateStr)) {
//     return dateStr; // Return as-is if it's already a weekday name
//   }

//   // Try to parse as date string (YYYY-MM-DD format)
//   try {
//     const date = new Date(dateStr + 'T00:00:00.000Z'); // Force UTC parsing

//     // Check if the date is valid
//     if (isNaN(date.getTime())) {
//       throw new Error(`Invalid date: ${dateStr}`);
//     }

//     const options: Intl.DateTimeFormatOptions = {
//       weekday: 'long',
//       timeZone: 'UTC'
//     };
//     return new Intl.DateTimeFormat('en-US', options).format(date);
//   } catch (error) {
//     console.error('getDayName error:', error);
//     console.error('Input was:', dateStr);
//     throw new Error(`Cannot determine day name from: ${dateStr}`);
//   }
// };

// export const getNextWeekDayDate = (dayName: string, startDate: Date): Date => {
//   const daysOfWeek = [
//     'Sunday',
//     'Monday',
//     'Tuesday',
//     'Wednesday',
//     'Thursday',
//     'Friday',
//     'Saturday'
//   ];
//   const dayIndex = daysOfWeek.indexOf(dayName);

//   const currentDayIndex = startDate.getDay();
//   let daysUntilNext = dayIndex - currentDayIndex;

//   if (daysUntilNext <= 0) {
//     daysUntilNext += 7; // Move to the next week if the day already passed
//   }

//   const nextDay = new Date(startDate);
//   nextDay.setDate(startDate.getDate() + daysUntilNext);
//   return nextDay;
// };

// // Fix: Get contractor data through User -> Contractor relationship
// export const getBookingDetails = async (payload: TBooking) => {
//   const { startTime, duration, contractorId } = payload;

//   // Calculate end time
//   const [startHour, startMinute] = startTime.split(':').map(Number);
//   const startDate = new Date();
//   startDate.setHours(startHour, startMinute, 0, 0);

//   const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
//   const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate
//     .getMinutes()
//     .toString()
//     .padStart(2, '0')}`;
//   payload.endTime = endTime;

//   // Fix: Get contractor rate through User -> Contractor relationship
//   try {
//     // First find the contractor profile using userId (which is the contractorId in booking)
//     const contractor = await Contractor.findOne({ _id: contractorId });

//     if (!contractor) {
//       throw new Error(
//         `Contractor profile not found for user ID: ${contractorId}`
//       );
//     }

//     payload.rateHourly = contractor.rateHourly;

//     // Calculate material total price
//     const materialTotalPrice =
//       payload.material?.reduce(
//         (total, material) => total + material.price,
//         0
//       ) || 0;

//     const price = materialTotalPrice + payload.rateHourly * duration;
//     payload.price = price;

//     payload.timeSlots = generateTimeSlots(startTime, endTime);

//     console.log('Booking details calculated:', {
//       startTime,
//       endTime,
//       duration,
//       rateHourly: payload.rateHourly,
//       materialTotalPrice,
//       finalPrice: price
//     });

//     return payload;
//   } catch (error) {
//     console.error('Error in getBookingDetails:', error);
//     throw error;
//   }
// };

// export const createRecurringBookingIntoDB = async (
//   updatedPayload: TBooking | any
// ) => {
//   const {
//     startTime,
//     day: days,
//     contractorId,
//     periodInDays = 30, // Default to 30 days if not provided
//     endTime
//   } = updatedPayload;

//   const futureBookings: any[] = [];

//   // Normalize today to UTC midnight
//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);

//   // Start from tomorrow
//   const startDate = new Date(today);
//   startDate.setDate(startDate.getDate() + 1);

//   // End at specified period from tomorrow
//   const endDate = new Date(startDate);
//   endDate.setDate(startDate.getDate() + periodInDays);

//   // Map day names to weekday numbers
//   const dayNameToNumber: Record<string, number> = {
//     Sunday: 0,
//     Monday: 1,
//     Tuesday: 2,
//     Wednesday: 3,
//     Thursday: 4,
//     Friday: 5,
//     Saturday: 6
//   };

//   // Ensure days is always an array
//   const daysArray = Array.isArray(days) ? days : [days];

//   // Loop from tomorrow to endDate (inclusive)
//   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
//     const currentWeekday = d.getDay();

//     for (const day of daysArray) {
//       const targetWeekday = dayNameToNumber[day];
//       if (currentWeekday === targetWeekday) {
//         const bookingDate = new Date(d);
//         bookingDate.setUTCHours(0, 0, 0, 0);

//         const requestedTimeSlots = generateTimeSlots(startTime, endTime);
//         const bookingPayload = {
//           ...updatedPayload,
//           day,
//           bookingDate,
//           timeSlots: requestedTimeSlots,
//           recurring: true
//         };

//         // Don't create booking for the first day (today/tomorrow)
//         if (bookingDate.getTime() !== startDate.getTime()) {
//           futureBookings.push(bookingPayload);
//         }
//       }
//     }
//   }

//   console.log(`Creating ${futureBookings.length} recurring bookings`);

//   // Check for conflicts and create bookings
//   const createdBookings = [];
//   for (const booking of futureBookings) {
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       bookingDate: booking.bookingDate,
//       timeSlots: { $in: booking.timeSlots },
//       status: { $ne: 'cancelled' }
//     });

//     if (existingBooking) {
//       console.warn(
//         `Slot already booked on ${booking.bookingDate.toISOString()}, skipping...`
//       );
//       continue; // Skip this booking instead of throwing error
//     }

//     try {
//       const createdBooking = await Booking.create(booking);
//       createdBookings.push(createdBooking);
//     } catch (error) {
//       console.error(
//         `Error creating booking for ${booking.bookingDate}:`,
//         error
//       );
//       // Continue with next booking instead of failing completely
//     }
//   }

//   return createdBookings;
// };

// export const createOneTimeBooking = async (updatedPayload: TBooking) => {
//   // Make sure bookingDate is properly formatted before saving
//   if (updatedPayload.bookingDate) {
//     const bookingDate = new Date(updatedPayload.bookingDate);
//     if (isNaN(bookingDate.getTime())) {
//       throw new Error('Invalid bookingDate in payload');
//     }
//     // Ensure it's properly normalized
//     bookingDate.setUTCHours(0, 0, 0, 0);
//     updatedPayload.bookingDate = bookingDate;
//   }

//   console.log('Creating one-time booking with payload:', {
//     customerId: updatedPayload.customerId,
//     contractorId: updatedPayload.contractorId,
//     bookingDate: updatedPayload.bookingDate,
//     day: updatedPayload.day,
//     startTime: updatedPayload.startTime,
//     endTime: updatedPayload.endTime,
//     price: updatedPayload.price,
//     status: updatedPayload.status || 'pending'
//   });

//   try {
//     const booking = await Booking.create(updatedPayload);
//     console.log('✅ One-time booking created successfully:', booking._id);
//     return booking;
//   } catch (error) {
//     console.error('❌ Error creating one-time booking:', error);
//     throw error;
//   }
// };

// export const checkAvailability = async (
//   contractorId: any,
//   startTime: string,
//   days: any,
//   bookingType: string
// ) => {
//   console.log('checkAvailability called with:', {
//     contractorId,
//     startTime,
//     days,
//     bookingType
//   });

//   // Add null check for startTime
//   if (!startTime) {
//     throw new Error('Start time is required for availability check');
//   }

//   const requestedTimeSlots = generateTimeSlots(
//     startTime,
//     addOneHour(startTime)
//   );

//   console.log('requestedTimeSlots', requestedTimeSlots);

//   // Fix: Find schedule using userId (contractorId references User, not Contractor)
//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) {
//     throw new Error('Contractor schedule not found');
//   }

//   console.log(
//     'Found schedule with',
//     schedule.schedules?.length,
//     'day schedules'
//   );

//   if (bookingType === 'OneTime') {
//     let requestedDate: Date | undefined = undefined;
//     let dayName: string;

//     // Handle different input formats for OneTime booking
//     if (typeof days === 'string') {
//       const weekdays = [
//         'Sunday',
//         'Monday',
//         'Tuesday',
//         'Wednesday',
//         'Thursday',
//         'Friday',
//         'Saturday'
//       ];

//       if (weekdays.includes(days)) {
//         dayName = days;
//         console.log('Using weekday name directly:', dayName);
//       } else {
//         // Try to parse as date string (YYYY-MM-DD format)
//         try {
//           requestedDate = new Date(days + 'T00:00:00.000Z');
//           if (isNaN(requestedDate.getTime())) {
//             throw new Error(`Invalid date format: ${days}`);
//           }
//           requestedDate.setUTCHours(0, 0, 0, 0);
//           dayName = getDayName(days);
//         } catch (error) {
//           throw new Error(`Cannot parse date: ${days}`);
//         }
//       }
//     } else {
//       throw new Error('Invalid days format for OneTime booking');
//     }

//     console.log('Checking availability for day:', dayName);

//     const daySchedule = schedule.schedules.find((s: any) => s.days === dayName);
//     if (!daySchedule) {
//       return {
//         available: false,
//         message: `Contractor is not available on ${dayName}`
//       };
//     }

//     console.log('Found day schedule:', daySchedule);
//     console.log('Available time slots:', daySchedule.timeSlots);

//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot: string) => !daySchedule.timeSlots.includes(slot)
//     );

//     console.log('Unavailable slots:', unavailableSlots);

//     if (unavailableSlots.length > 0) {
//       return {
//         available: false,
//         message: `Requested slots ${unavailableSlots.join(
//           ', '
//         )} are unavailable. Available slots: ${daySchedule.timeSlots.join(
//           ', '
//         )}`
//       };
//     }

//     // Check for booking conflicts if we have a valid date
//     if (requestedDate) {
//       const existingBooking = await Booking.findOne({
//         contractorId,
//         bookingDate: requestedDate,
//         timeSlots: { $in: requestedTimeSlots },
//         status: { $ne: 'cancelled' }
//       });

//       if (existingBooking) {
//         return {
//           available: false,
//           message: `Time slot ${requestedTimeSlots.join(
//             ', '
//           )} is already booked on ${requestedDate.toISOString().split('T')[0]}`
//         };
//       }
//     }

//     return { available: true, message: 'Time slot is available' };
//   }

//   // Weekly booking logic
//   if (bookingType === 'weekly') {
//     const daysArray = Array.isArray(days) ? days : [days];

//     for (const day of daysArray) {
//       const daySchedule = schedule.schedules.find((s: any) => s.days === day);

//       if (!daySchedule) {
//         return {
//           available: false,
//           message: `Contractor is not available on ${day}`
//         };
//       }

//       const unavailableSlots = requestedTimeSlots.filter(
//         (slot: string) => !daySchedule.timeSlots.includes(slot)
//       );

//       if (unavailableSlots.length > 0) {
//         return {
//           available: false,
//           message: `Requested slots ${unavailableSlots.join(
//             ', '
//           )} are unavailable on ${day}`
//         };
//       }
//     }

//     // Check for existing bookings
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       day: { $in: daysArray },
//       startTime: { $gte: startTime, $lte: addOneHour(startTime) },
//       status: { $ne: 'cancelled' }
//     });

//     if (existingBooking) {
//       return {
//         available: false,
//         message: `Time slot is already booked for one of the requested days`
//       };
//     }

//     return {
//       available: true,
//       message: 'All requested time slots are available'
//     };
//   }

//   throw new Error(
//     `Invalid booking type: ${bookingType}. Must be 'oneTime' or 'weekly'`
//   );
// };

// // Fix: Improve date validation
// export function checkOrderDate (days: any, bookingType?: string) {
//   console.log('checkOrderDate input:', { days, bookingType });

//   try {
//     // Handle weekday names for weekly bookings
//     const weekdays = [
//       'Monday',
//       'Tuesday',
//       'Wednesday',
//       'Thursday',
//       'Friday',
//       'Saturday',
//       'Sunday'
//     ];

//     if (typeof days === 'string' && weekdays.includes(days)) {
//       if (bookingType === 'weekly') {
//         return days; // Valid weekday name for weekly booking
//       } else {
//         // For oneTime, weekday name alone is not sufficient
//         console.log('Weekday name provided for oneTime booking:', days);
//         return days; // Let the calling function handle this
//       }
//     }

//     // Handle arrays for weekly bookings
//     if (Array.isArray(days)) {
//       if (bookingType === 'weekly') {
//         // Validate each day in the array
//         for (const day of days) {
//           if (!weekdays.includes(day)) {
//             throw new Error(`Invalid weekday: ${day}`);
//           }
//         }
//         return days;
//       } else {
//         throw new Error('Arrays are only supported for weekly bookings');
//       }
//     }

//     // Handle date strings
//     if (typeof days === 'string') {
//       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
//       if (!dateRegex.test(days)) {
//         throw new Error(
//           `Invalid date format: "${days}". Expected format: YYYY-MM-DD`
//         );
//       }

//       const orderDate = new Date(days + 'T00:00:00.000Z');

//       if (isNaN(orderDate.getTime())) {
//         throw new Error(`Could not parse date: "${days}"`);
//       }

//       // Check if the date is not in the past
//       const today = new Date();
//       today.setUTCHours(0, 0, 0, 0);

//       const orderDateUTC = new Date(orderDate);
//       orderDateUTC.setUTCHours(0, 0, 0, 0);

//       if (orderDateUTC < today) {
//         throw new Error(
//           `Booking date ${days} is in the past. Please select a future date.`
//         );
//       }

//       return orderDateUTC.toISOString().split('T')[0]; // Return YYYY-MM-DD format
//     }

//     // Handle Date objects
//     if (days instanceof Date) {
//       const orderDate = new Date(days);
//       if (isNaN(orderDate.getTime())) {
//         throw new Error('Invalid Date object provided');
//       }

//       const today = new Date();
//       today.setUTCHours(0, 0, 0, 0);

//       orderDate.setUTCHours(0, 0, 0, 0);

//       if (orderDate < today) {
//         throw new Error(
//           'Booking date is in the past. Please select a future date.'
//         );
//       }

//       return orderDate.toISOString().split('T')[0];
//     }

//     throw new Error(`Unsupported input type: ${typeof days}`);
//   } catch (error) {
//     console.error('Date validation error:', error);
//     if (error instanceof Error) {
//       throw error;
//     } else {
//       throw new Error('Date validation failed with unknown error');
//     }
//   }
// }
////////////////////////////////////////////////////////////////////////////
//============================================================================
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
  // Logic to create a one-time booking (insert into DB)
  const booking = await Booking.create(updatedPayload);
  return booking;
};

export const checkAvailability = async (
  contractorId: any,
  startTime: any,
  days: any,
  bookingType: any
) => {
  const requestedTimeSlots = generateTimeSlots(
    startTime,
    addOneHour(startTime)
  );
    console.log('requestedTimeSlots:', requestedTimeSlots);

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');
     console.log('schedule:', schedule);
  if (bookingType === 'oneTime') {
          console.log('inside OneTime:');
    const requestedDate = new Date(days as string); // ex: "2025-07-14"
    requestedDate.setUTCHours(0, 0, 0, 0); // normalize to 00:00 UTC
    const dayName = getDayName(days as string); // "Monday"
    const daySchedule = schedule.schedules.find(s => s.days === dayName);
      console.log('daySchedule:', daySchedule);
    if (!daySchedule) {
      return {
        available: false,
        message: `Contractor is not available on ${dayName}`
      };
    }

    const unavailableSlots = requestedTimeSlots.filter(
      (slot: any) => !daySchedule.timeSlots.includes(slot)
    );
      console.log('unavailableSlots:', unavailableSlots);

    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }

    // ✅ Duplicate check using date and time slot match
    const existingBooking = await Booking.findOne({
      contractorId,
      bookingDate: requestedDate, // must match exactly (normalized date)
      timeSlots: { $in: requestedTimeSlots }, // any overlap
      status: { $ne: 'cancelled' }
    });
  console.log('Existing booking found:', existingBooking);
    if (existingBooking) {
      return { available: false, message: 'Time slot is already booked.' };
    }
      // console.log('available:', available);
    const a =  { available: true }
    return a;
  }

  if (bookingType === 'weekly') {
     console.log('inside: weekly');

    for (const day of days) {
      let daySchedule: any;

      // Convert specific date to day name if one-time booking
      if (bookingType === 'oneTime') {
        const requestedDay = getDayName(day); // Convert to day name
        daySchedule = schedule.schedules.find(s => s.days === requestedDay);
      } else if (bookingType === 'weekly') {
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
  }
};

