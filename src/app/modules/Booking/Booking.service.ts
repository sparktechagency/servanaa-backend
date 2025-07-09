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
import { Contractor } from '../Contractor/Contractor.model';
import cron from 'node-cron';

// Helper functions for time slot generation, day extraction
const generateTimeSlots = (startTime: string, endTime: string): string[] => {
  const timeSlots = [];
  let currentTime = startTime;

  while (currentTime < endTime) {
    const nextTime = addOneHour(currentTime);
    timeSlots.push(`${currentTime}-${nextTime}`);
    currentTime = nextTime;
  }

  return timeSlots;
};

const addOneHour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(0, 0, 0, hours, minutes);
  date.setHours(date.getHours() + 1);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const getDayName = (dateStr: string):string => {
  const date = new Date(dateStr);  // Convert date string to Date object
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
  return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
};

// Function to fetch customers with recurring bookings
const getAllCustomersWithRecurringBookings = async () => {
  // Assuming recurring bookings are marked with a "recurring" field set to true
  return await Booking.find({ recurring: true }, { contractorId: 1, _id: 1 });
  // return await Booking.find({ recurring: true }).distinct('customerId');
};

// Common function to calculate endTime, price, and rateHourly for both booking types
const getBookingDetails = async (payload: TBooking) => {
  const { startTime, duration, contractorId } = payload;
  // Calculate end time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Calculate end time based on duration
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  payload.endTime = endTime; // Attach endTime to payload


  // Get contractor rate and calculate price
  const contractor = await Contractor.findById(contractorId);
  if (!contractor) throw new Error('Contractor not found');
  payload.rateHourly = contractor.rateHourly;
  // Calculate material total price
  const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0);
  const price = materialTotalPrice + (payload.rateHourly * duration); // Final price
  payload.price = price;


  return payload; // Return updated payload with all the details
};

// Main booking service function to handle both one-time and recurring bookings
// const createBookingIntoDB = async (payload: TBooking) => {
//   const { bookingType, contractorId, days, periodInDays } = payload;
//   console.log(periodInDays, 'periodInDays');
//   // Step 1: Get booking details (end time, price, rateHourly, etc.)
//   const updatedPayload = await getBookingDetails(payload); // Call common function

//   // Step 2: Check availability (this will handle both one-time and recurring bookings)
//   const result = await checkAvailability(contractorId, updatedPayload.startTime, updatedPayload.duration, days, bookingType);
//   if (!result.available) {
//     return { message: result.message || 'Slot is unavailable.' }; // Reject booking if unavailable
//   }

//   // Step 3: Create the booking (either one-time or recurring)
//   if (bookingType === 'OneTime') {
//     const booking = await createOneTimeBooking(updatedPayload); // Create one-time booking
//     return booking;
//   } else if (bookingType === 'Weekly') {
//     const booking = await createRecurringBookingIntoDB(updatedPayload); // Create recurring bookings
//     return booking;
//   }
// };
const createBookingIntoDB = async (payload: TBooking) => {
  const { bookingType, contractorId, day } = payload;

  // Step 1: Get booking details (end time, price, rateHourly, etc.)
  const updatedPayload = await getBookingDetails(payload); // Call common function

  // Step 2: Check availability (this will handle both one-time and recurring bookings)
  const result = await checkAvailability(contractorId, updatedPayload.startTime, day, bookingType);
  if (!result.available) {
    return { message: result.message || 'Slot is unavailable.' }; // Reject booking if unavailable
  }

  // Step 3: Create the booking (either one-time or recurring)
  if (bookingType === 'OneTime') {
    const booking = await createOneTimeBooking(updatedPayload); // Create one-time booking
    return booking;
  } else if (bookingType === 'Weekly') {
    const booking = await createRecurringBookingIntoDB(updatedPayload); // Create recurring bookings
    return booking;
  }
};

// Function to check availability for both one-time and recurring bookings
const checkAvailability = async (contractorId: any, startTime: any, days: any, bookingType: any) => {
  const requestedTimeSlots = generateTimeSlots(startTime, addOneHour(startTime));

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  for (const day of days) {
    let daySchedule;
    
    // Convert specific date to day name if one-time booking
    if (bookingType === 'OneTime') {
      const requestedDay = getDayName(day); // Convert to day name
      daySchedule = schedule.schedules.find((s) => s.days === requestedDay);
    } 
    else if (bookingType === 'Weekly') {
      daySchedule = schedule.schedules.find((s) => s.days === day); 
    }

    if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot) => !daySchedule.timeSlots.includes(slot)
    );
    
    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }
  }


  // Check for overlapping bookings for future recurring or one-time slots
  const existingBooking = await Booking.findOne({
    contractorId,
    days: { $in: days }, // This checks if the requested day matches any day in the booking collection
    startTime: { $gte: startTime, $lte: addOneHour(startTime) },  // Compare time range
    status: { $ne: 'cancelled' },
  });

  if (existingBooking) {
    return { available: false, message: 'Time slot is already booked.' };
  }

  return { available: true };
};

// Function to create a one-time booking
const createOneTimeBooking = async (updatedPayload: TBooking) => {
  // Logic to create a one-time booking (insert into DB)
  const booking = await Booking.create(updatedPayload);
  return booking;
};

// Function to create recurring bookings (for weekly or monthly)
// const createRecurringBookingIntoDB = async (updatedPayload: TBooking | any) => {
//   const { startTime, day: days, contractorId, periodInDays } = updatedPayload;
//   // Calculate end time and price (common logic)


//   // const updatedBooking = await getBookingDetails(updatedPayload);

//   const futureBookings: any[] = [];
//   const currentDate = new Date();

//  // Calculate the number of weeks to loop (periodInDays / 7)
//   const numOfWeeks = periodInDays / 7;
//       console.log('numOfWeeks', numOfWeeks)
//   // Create future recurring bookings for the selected days
//   for (let i = 0; i < numOfWeeks; i++) {
//           console.log('time loop', i)

//     const bookingDate = new Date(currentDate);
//     bookingDate.setDate(bookingDate.getDate() + (i * 7)); // 7 days for weekly recurrence
//       console.log('bookingDate', bookingDate)

//     for (const day of days) {
//       const daySchedule = await MySchedule.findOne({ contractorId });
//       console.log('daySchedule', daySchedule)
//       const requestedTimeSlots = generateTimeSlots(startTime, updatedPayload.endTime);
//             console.log('requestedTimeSlots', requestedTimeSlots)

//       const bookingPayload = {
//         ...updatedPayload,
//         day:day,
//         bookingDate,
//         timeSlots: requestedTimeSlots,
//         recurring: true,
//       };
//       futureBookings.push(bookingPayload);
//     }
//   }
//     console.log('futureBookings', futureBookings)

//   // Check for conflicts with existing bookings before creating future bookings
//   for (const booking of futureBookings) {
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       bookingDate: booking.bookingDate,
//       status: { $ne: 'cancelled' },
//     });

//     console.log('existingBooking', existingBooking)
//     if (existingBooking) throw new Error('Slot is already booked for the requested date');
//     await Booking.create(booking); // Create new recurring booking
//   }

//   return futureBookings; // Return the created recurring bookings
// };

const createRecurringBookingIntoDB = async (updatedPayload: TBooking | any) => {
  const { startTime, day: days, contractorId, periodInDays, endTime } = updatedPayload;

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
     
            if(bookingDate.getDate() !== startDate.getDate()) {
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
        `Slot already booked on ${booking.bookingDate.toISOString()}`
      );
    }
    
    await Booking.create(booking);
  }

  return futureBookings;
};



// Cron job for automatic renewal of recurring bookings for Customer A

// Schedule the cron job to run at 11:59 PM on the last day of the month
cron.schedule('59 23 28-31 * *', async () => {
  const currentDate = new Date();
   console.log('currentDate', currentDate)
  const customers = await getAllCustomersWithRecurringBookings(); // Fetch customers with recurring bookings
  for (const  customer of customers) {
    const contractorId = customer?.contractorId;
    const customerId = customer._id;
    
    // Automatically renew recurring bookings for the next month
    await renewRecurringBookingForNextMonth(customerId, contractorId);
  }

  console.log('Recurring bookings for the next month created successfully!');
});

// Function to renew recurring bookings for Customer A after a period ends
const renewRecurringBookingForNextMonth = async (customerId:any, contractorId:any) => {
  const existingBookings = await Booking.find({
    customerId,
    contractorId,
    status: { $ne: 'cancelled' },
  });

  const lastBookingDate = existingBookings[existingBookings.length - 1].bookingDate;
  const newStartDate = new Date(lastBookingDate);
  newStartDate.setMonth(newStartDate.getMonth() + 1); // Move to the next month

  // Create new recurring bookings for the next month
  await createRecurringBookingIntoDB({ ...existingBookings[0], startDate: newStartDate });
};

const checkAvailabilityIntoDB = async (contractorId: any, startTime: any, duration: any, days: any, bookingType: any) => {
  const requestedTimeSlots = generateTimeSlots(startTime, addOneHour(startTime));

  const schedule = await MySchedule.findOne({ contractorId });
  if (!schedule) throw new Error('Contractor schedule not found');

  for (const day of days) {
    let daySchedule;
    
    // Convert specific date to day name if one-time booking
    if (bookingType === 'OneTime') {
      const requestedDay = getDayName(day); // Convert to day name
      daySchedule = schedule.schedules.find((s) => s.days === requestedDay);
    } 
    else if (bookingType === 'Weekly') {
      daySchedule = schedule.schedules.find((s) => s.days === day); 
    }

    if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot) => !daySchedule.timeSlots.includes(slot)
    );
    
    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }
  }

  // Check for overlapping bookings for future recurring or one-time slots
  const existingBooking = await Booking.findOne({
    contractorId,
    days: { $in: days }, // This checks if the requested day matches any day in the booking collection
    startTime: { $gte: startTime, $lte: addOneHour(startTime) },  // Compare time range
    status: { $ne: 'cancelled' },
  });

  if (existingBooking) {
    return { available: false, message: 'Time slot is already booked.' };
  }

  return { available: true };
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
  const BookingQuery = new QueryBuilder(
    Booking.find(),
    query,
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
    meta,
  };
};

const getSingleBookingFromDB = async (id: string) => {
  const result = await Booking.findById(id);
  return result;
};

const updateBookingIntoDB = async (id: string, payload: any) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new Error("Booking not found");
  if (booking.isDeleted) throw new Error("Cannot update a deleted Booking");
  const updatedData = await Booking.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Booking cannot update');
  }

  return updatedData;
};
const updatePaymentStatusIntoDB = async (id: string, payload: any) => {
const booking = await Booking.findOne({clientId:id, paymentStatus:"pending"});

  if (!booking) throw new Error("Booking not found");
  if (booking.isDeleted) throw new Error("Cannot update a deleted Booking");

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
  const deletedService = await Booking.findByIdAndDelete(
    id,
    { new: true },
  );

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
  checkAvailabilityIntoDB
  // getAllBookingsByUserFromDB
};
