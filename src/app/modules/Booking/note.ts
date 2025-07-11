// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import httpStatus from 'http-status';
// import QueryBuilder from '../../builder/QueryBuilder';
// import AppError from '../../errors/AppError';
// import { BOOKING_SEARCHABLE_FIELDS } from './Booking.constant';
// import { TBooking } from './Booking.interface';
// import { Booking } from './Booking.model';
// import { MySchedule } from '../MySchedule/MySchedule.model';
// import { Contractor } from '../Contractor/Contractor.model';
// // import { generateTimeSlots, getDayName } from './Booking.utils';
// // import { generateTimeSlots, getDayName, getNextWeekDayDate } from './Booking.utils';
// import cron from 'node-cron';
// import cron from 'node-cron';

// // import { Notification } from '../Notification/Notification.model';


// // const createBookingIntoDB = async (
// //   payload: TBooking,
// // ) => {
// //   const { startTime, duration, bookingType, day } = payload;
// //  // Convert startTime to a Date object
// //   const [startHour, startMinute] = startTime.split(':').map(Number);
// //   const startDate = new Date();
// //   startDate.setHours(startHour, startMinute, 0, 0); // Set the start time to the specified hour and minute

// // // Calculate endTime by adding duration (in hours) to startTime
// //   const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Multiply duration (in hours) by milliseconds 
// //   // Format endTime as HH:mm (ensuring it is returned in the same format as startTime)
// //   const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
// //   payload.endTime = endTime;

// // // Step Add rateHourly to payload
// //   const myScheduleId = await Contractor.findOne({ _id: payload.contractorId });
// //   if (!myScheduleId) {
// //     throw new Error('Contractor availability not found');
// //   }
// //   payload.rateHourly = myScheduleId.rateHourly;

// // // Step 2: Calculate the price add to payload
// //   const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0); // Sum up all material prices
// //   const price = materialTotalPrice + (payload.rateHourly * duration); // Add hourly rate multiplied by the duration to the total material price
// //   payload.price = price;

// //   if(bookingType === 'OneTime'){
// //  // Retrieve contractor's availability for the given day
// //   const schedule = await MySchedule.findOne({ contractorId: payload.contractorId });
// //     // Find the specific day's availability
// //     const dayName = getDayName(day);  // This will return "Monday"
// //   const daySchedule = schedule?.schedules?.find((s:any) => s.day === dayName);
// //   if (!daySchedule) {
// //     throw new Error('Contractor is not available on this day');
// //   }

// //   // Generate requested time slots based on the startTime and endTime
// //   const requestedTimeSlots = generateTimeSlots(startTime, endTime);

// //   // 1. Check if any of the requested slots are not available
// //   const unavailableSlots = requestedTimeSlots.filter((slot:any) => !daySchedule.timeSlots.includes(slot));
// //   // If we find any slots that are not in contractor's available time slots, then it's unavailable
// //   if (unavailableSlots.length > 0) {
// //     return { available: false, unavailableSlots };
// //   }
// //   // 2. Check for overlapping bookings with existing bookings
// //   const existingBooking = await Booking.findOne({
// //     contractorId: payload.contractorId,
// //     day: day,
// //     // startTime: { $gte: startTime, $lte: endTime },
// //     // timeSlots: requestedTimeSlots,
// //     timeSlots: { $in: requestedTimeSlots },
// //     status: { $ne: 'cancelled' },
// //   });

// //   if (existingBooking) {
// //     // If there is an existing booking that overlaps with the requested time range
// //       throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Booking - Slot is already booked');
// //   }
// //    payload.timeSlots = requestedTimeSlots;
// //   }

  

// //   const result = await Booking.create(payload);
// //   if (!result) {
// //     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Booking');
// //   }

// //     return result;
// // };
// //////////////////////////////////////////////////////////////

// const generateTimeSlots = (startTime: string, endTime: string): string[] => {
//   const timeSlots = [];
//   let currentTime = startTime;

//   while (currentTime < endTime) {
//     const nextTime = addOneHour(currentTime);
//     timeSlots.push(`${currentTime}-${nextTime}`);
//     currentTime = nextTime;
//   }

//   return timeSlots;
// };

// const addOneHour = (time: string): string => {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date(0, 0, 0, hours, minutes);
//   date.setHours(date.getHours() + 1);
//   return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
// };

// export const getDayName = (dateStr: string):string => {
//   const date = new Date(dateStr);  // Convert date string to Date object
//   const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
//   return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
// };

// const getBookingDetails = async (payload: TBooking) => {
//   const { startTime, duration, contractorId } = payload;

//   // Step 1: Parse the start time and calculate the end time
//   const [startHour, startMinute] = startTime.split(':').map(Number);
//   const startDate = new Date();
//   startDate.setHours(startHour, startMinute, 0, 0);

//   const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Calculate the end time based on duration
//   const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
//   payload.endTime = endTime; // Attach the endTime to the payload

//   // Step 2: Get contractor rate and calculate price
//   const contractor = await Contractor.findOne({ _id: contractorId });
//   if (!contractor) throw new Error('Contractor not found');
//   payload.rateHourly = contractor.rateHourly;

//   // Calculate material total price
//   const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0);
//   const price = materialTotalPrice + (payload.rateHourly * duration); // Final price
//   payload.price = price;

//   return payload; // Return updated payload with all the details
// };


// const createBookingIntoDB = async (payload: TBooking) => {
//   const { bookingType, contractorId, days, periodInDays } = payload;

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

// // Function to check availability for both one-time and recurring bookings
// const checkAvailability = async (contractorId: any, startTime: string, duration: number, days: any, bookingType: any) => {
//   const requestedTimeSlots = generateTimeSlots(startTime, addOneHour(startTime)); // Generate time slots for requested time

//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) throw new Error('Contractor schedule not found');

//   // Check for each day if the contractor has available time slots
//   for (const day of days) {
//     const daySchedule = schedule.schedules.find((s) => s.day === day);
//     if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

//     // Check if any of the requested time slots overlap with existing bookings
//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot) => !daySchedule.timeSlots.includes(slot)
//     );
//     if (unavailableSlots.length > 0) {
//       return { available: false, message: 'Requested slots are unavailable.' };
//     }
//   }

//   // Check if any overlapping bookings already exist in the booking collection for the requested time
//   const existingBooking = await Booking.findOne({
//     contractorId,
//     startTime: { $gte: startTime, $lte: addOneHour(startTime) },
//     status: { $ne: 'cancelled' },
//   });

//   if (existingBooking) {
//     return { available: false, message: 'Time slot is already booked.' };
//   }

//   return { available: true };
// };

// // Function to create a one-time booking
// const createOneTimeBooking = async (updatedPayload: TBooking) => {
//   // Logic to create a one-time booking (insert into DB)
//   const booking = await Booking.create(updatedPayload);
//   return booking;
// };

// // Function to create recurring bookings (for weekly or monthly)
// const createRecurringBookingIntoDB = async (updatedPayload: TBooking) => {
//   const { startTime, duration, days, contractorId, periodInDays } = updatedPayload;
//       console.log('duration  periodInDays', duration, periodInDays)

//   // Calculate end time and price (common logic)
//   const updatedBooking = await getBookingDetails(updatedPayload);

//   const futureBookings: any[] = [];
//   const currentDate = new Date();

//   // Create future recurring bookings for the selected days
//   for (let i = 0; i < periodInDays; i++) {
//     const bookingDate = new Date(currentDate);
//     bookingDate.setDate(bookingDate.getDate() + (i * 7)); // 7 days for weekly recurrence

//     for (const day of days) {
//       const daySchedule = await MySchedule.findOne({ contractorId });
//       console.log('daySchedule', daySchedule)
//       const requestedTimeSlots = generateTimeSlots(startTime, updatedBooking.endTime);
//       const bookingPayload = {
//         ...updatedBooking,
//         day,
//         bookingDate,
//         timeSlots: requestedTimeSlots,
//         recurring: true,
//       };
//       futureBookings.push(bookingPayload);
//     }
//   }

//   // Check for conflicts with existing bookings before creating future bookings
//   for (const booking of futureBookings) {
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       bookingDate: booking.bookingDate,
//       status: { $ne: 'cancelled' },
//     });

//     if (existingBooking) throw new Error('Slot is already booked for the requested date');
//     await Booking.create(booking); // Create new recurring booking
//   }

//   return futureBookings; // Return the created recurring bookings
// };

// // Fetch customers with recurring bookings (you can modify this query as needed)
// const getAllCustomersWithRecurringBookings = async () => {
//   return await Booking.find({ recurring: true }).distinct('customerId');
// };

// // Schedule the cron job to run at 11:59 PM on the last day of the month
// cron.schedule('59 23 28-31 * *', async () => {
//   const currentDate = new Date();
//         console.log('currentDate', currentDate)

///////////////]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
// Function to fetch customers with recurring bookings
// const getAllCustomersWithRecurringBookings = async () => {
//   // Assuming recurring bookings are marked with a "recurring" field set to true
//   return await Booking.find({ recurring: true }, { contractorId: 1, _id: 1 });
//   // return await Booking.find({ recurring: true }).distinct('customerId');
// };
///////////////]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]







//   const customers = await getAllCustomersWithRecurringBookings(); // Fetch customers with recurring bookings
//   for (const customer of customers) {
//     const contractorId = customer.contractorId;
//     const customerId = customer._id;
    
//     // Automatically renew recurring bookings for the next month
//     await renewRecurringBookingForNextMonth(customerId, contractorId);
//   }

//   console.log('Recurring bookings for the next month created successfully!');
// });

// // Function to renew recurring bookings for Customer A after a period ends
// const renewRecurringBookingForNextMonth = async (customerId: string, contractorId: string) => {
//   const existingBookings = await Booking.find({
//     customerId,
//     contractorId,
//     status: { $ne: 'cancelled' },
//   });

//   const lastBookingDate = existingBookings[existingBookings.length - 1].bookingDate;
//   const newStartDate = new Date(lastBookingDate);
//   newStartDate.setMonth(newStartDate.getMonth() + 1); // Move to the next month

//   // Create new recurring bookings for the next month
//   await createRecurringBookingIntoDB({ ...existingBookings[0], startDate: newStartDate });
// };


// /////////////////////
// // const createBookingIntoDB = async (
// //   payload: TBooking,
// // ) => {
// //   const { startTime, duration, bookingType, days,contractorId } = payload;
// //  // Convert startTime to a Date object
// //   const [startHour, startMinute] = startTime.split(':').map(Number);
// //   const startDate = new Date();
// //   startDate.setHours(startHour, startMinute, 0, 0); // Set the start time to the specified hour and minute

// // // Calculate endTime by adding duration (in hours) to startTime
// //   const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Multiply duration (in hours) by milliseconds 
// //   // Format endTime as HH:mm (ensuring it is returned in the same format as startTime)
// //   const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
// //   payload.endTime = endTime;

// // // Step Add rateHourly to payload
// //   const myScheduleId = await Contractor.findOne({ _id: contractorId });
// //   if (!myScheduleId) {
// //     throw new Error('Contractor availability not found');
// //   }
// //   payload.rateHourly = myScheduleId.rateHourly;

// // // Step 2: Calculate the price add to payload
// //   const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0); // Sum up all material prices
// //   const price = materialTotalPrice + (payload.rateHourly * duration); // Add hourly rate multiplied by the duration to the total material price
// //   payload.price = price;

// //   if(bookingType === 'Weekly'){
// //  // Retrieve contractor's availability for the given day
// //   const schedule = await MySchedule.findOne({ contractorId });
// //   if (!schedule) {
// //       throw new Error('Contractor schedule not found');
// //     }

// //   // Check availability for each selected day
// //     const unavailableSlots: string[] = [];
// //     for (const day of days) {
// //       //  const dayName = getDayName(days); 
// //       const daySchedule = schedule?.schedules?.find((s:any) => s.day === day);
// //       if (!daySchedule) {
// //         throw new Error(`Contractor is not available on ${day}`);
// //       }

// //       // Generate requested time slots based on the startTime and endTime
// //       const requestedTimeSlots = generateTimeSlots(startTime, endTime);

// //       // Check if any of the requested time slots are unavailable
// //       const unavailableForDay = requestedTimeSlots.filter((slot: any) => !daySchedule.timeSlots.includes(slot));
// //       if (unavailableForDay.length > 0) {
// //         unavailableSlots.push(...unavailableForDay);
// //       }
// //     }

// //        if (unavailableSlots.length > 0) {
// //       return { available: false, unavailableSlots };
// //     }

// //     // Step 2: Check for overlapping bookings with existing bookings (for each day)
// //     for (const day of days) {
// //       const existingBooking = await Booking.findOne({
// //         contractorId: contractorId,
// //         day,
// //         startTime: { $gte: startTime, $lte: endTime },
// //         status: { $ne: 'cancelled' },
// //       });

// //       if (existingBooking) {
// //         throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Booking - Slot is already booked');
// //       }
// //     }


// //    // Create recurring bookings for each selected day indefinitely
// //     const bookings = [];
// //     for (const day of days) {
// //       // Calculate the next week's date for the selected day
// //       const bookingDate = getNextWeekDayDate(day, startDate);
// //       const requestedTimeSlots = generateTimeSlots(startTime, endTime);
// //       // Add day-specific details to the payload
// //       const bookingPayload = {
// //         ...payload,
// //         day,
// //         bookingDate,
// //         timeSlots: requestedTimeSlots,
// //         recurring: true, // Mark as recurring
// //       };

// //       const newBooking = await Booking.create(bookingPayload);
// //       bookings.push(newBooking);
// //     }

// //     return bookings
// //   }
// // };
//   // if (result) {

//   //   const notificationPayload = {
//   //     clientId: result.clientId,
//   //     title: 'booking_request',
//   //     bookingId: result._id,
//   //     message: 'A new booking request has been made',
//   //     isRead: false,
//   //     isDeleted: false,
//   //   };

//   //   const notification = await Notification.create(notificationPayload);

//   //   if (!notification) {
//   //     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Notification');
//   //   }

//   // }
  
// //   return result;
// // };

// const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
//   const BookingQuery = new QueryBuilder(
//     Booking.find(),
//     query,
//   )
//     .search(BOOKING_SEARCHABLE_FIELDS)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await BookingQuery.modelQuery;
//   const meta = await BookingQuery.countTotal();
//   return {
//     result,
//     meta,
//   };
// };

// const getSingleBookingFromDB = async (id: string) => {
//   const result = await Booking.findById(id);

//   return result;
// };

// const updateBookingIntoDB = async (id: string, payload: any) => {


//   const booking = await Booking.findById(id);

//   if (!booking) throw new Error("Booking not found");
//   if (booking.isDeleted) throw new Error("Cannot update a deleted Booking");

//   const updatedData = await Booking.findByIdAndUpdate(
//     { _id: id },
//     payload,
//     { new: true, runValidators: true },
//   );


//   if (!updatedData) {
//     throw new Error('Booking cannot update');
//   }



//   // Store previous status to compare later
//   // const prevStatus = booking.status;

//   // Merge payload fields, including nested frequency if present
//   // for (const key in payload) {
//   //   if (!payload.hasOwnProperty.call(payload,key)) continue;
//   //   const value = payload[key];
//   //   if (typeof value === 'object' && value !== null && !Array.isArray(value) && key === 'frequency') {
//   //     // merge frequency fields instead of overwrite
//   //     booking.frequency = {
//   //       ...booking.frequency.toObject(),
//   //       ...value,
//   //     }; 
//   //   } else {
//   //     (booking as any)[key] = value;
//   //   }
//   // }
  

//    // Check if status changed
//   // if (payload.status && payload.status !== prevStatus) {
//   //   // Define notification message and type based on new status
//   //   let notificationType = '';
//   //   let notificationMessage = '';

//   //   switch (payload.status) {
//   //     case 'completed':
//   //       notificationType = 'booking_complete';
//   //       notificationMessage = `Booking #${booking._id} has been completed.`;
//   //       break;
//   //     case 'cancelled':
//   //       notificationType = 'booking_cancel';
//   //       notificationMessage = `Booking #${booking._id} has been cancelled.`;
//   //       break;
//   //     case 'ongoing':
//   //       notificationType = 'booking_confirm';
//   //       notificationMessage = `Booking #${booking._id} is now ongoing.`;
//   //       break;
//   //     // Add other statuses if needed
//   //     default:
//   //       break;
//   //   }

//   //   if (notificationType) {
//   //     await Notification.create({
//   //       clientId: booking.clientId,   // or booking.userId, depends on your schema
//   //       title: notificationType,
//   //       bookingId: booking._id,
//   //       message: notificationMessage,
//   //       isRead: false,
//   //       isDeleted: false,
//   //       createdAt: new Date(),
//   //     });
//   //   }
//   // }


    
//   // await booking.save();

//   return updatedData;
// };
// const updatePaymentStatusIntoDB = async (id: string, payload: any) => {
// const booking = await Booking.findOne({clientId:id, paymentStatus:"pending"});

//   if (!booking) throw new Error("Booking not found");
//   if (booking.isDeleted) throw new Error("Cannot update a deleted Booking");


//   // add new payment status
// const update = { paymentStatus: payload.paymentStatus };


    
//     const updatedData = await Booking.findByIdAndUpdate(
//       { _id: booking._id },
//       update,
//       { new: true, runValidators: true },
//     );

//   return updatedData;
// };


// const deleteBookingFromDB = async (id: string) => {
//   const deletedService = await Booking.findByIdAndDelete(
//     id,
//     // { isDeleted: true },
//     { new: true },
//   );

//   if (!deletedService) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Booking');
//   }

//   return deletedService;
// };

// export const BookingServices = {
//   createBookingIntoDB,
//   getAllBookingsFromDB,
//   getSingleBookingFromDB,
//   updateBookingIntoDB,
//   deleteBookingFromDB,
//   updatePaymentStatusIntoDB
//   // getAllBookingsByUserFromDB
// };
////////////////////////////////////////////////////////////////////////
// Secont One

// // Helper functions for time slot generation, day extraction
// const generateTimeSlots = (startTime: string, endTime: string): string[] => {
//   const timeSlots = [];
//   let currentTime = startTime;

//   while (currentTime < endTime) {
//     const nextTime = addOneHour(currentTime);
//     timeSlots.push(`${currentTime}-${nextTime}`);
//     currentTime = nextTime;
//   }

//   return timeSlots;
// };

// const addOneHour = (time: string): string => {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date(0, 0, 0, hours, minutes);
//   date.setHours(date.getHours() + 1);
//   return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
// };

// export const getDayName = (dateStr: string):string => {
//   const date = new Date(dateStr);  // Convert date string to Date object
//   const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
//   return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
// };

// // Function to fetch customers with recurring bookings
// const getAllCustomersWithRecurringBookings = async () => {
//   // Assuming recurring bookings are marked with a "recurring" field set to true
//   return await Booking.find({ recurring: true }, { contractorId: 1, _id: 1 });
//   // return await Booking.find({ recurring: true }).distinct('customerId');
// };

// // Common function to calculate endTime, price, and rateHourly for both booking types
// const getBookingDetails = async (payload: TBooking) => {
//   const { startTime, duration, contractorId } = payload;

//   // Calculate end time
//   const [startHour, startMinute] = startTime.split(':').map(Number);
//   const startDate = new Date();
//   startDate.setHours(startHour, startMinute, 0, 0);

//   const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Calculate end time based on duration
//   const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
//   payload.endTime = endTime; // Attach endTime to payload

//   // Get contractor rate and calculate price
//   const contractor = await Contractor.findOne({ _id: contractorId });
//   if (!contractor) throw new Error('Contractor not found');
//   payload.rateHourly = contractor.rateHourly;

//   // Calculate material total price
//   const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0);
//   const price = materialTotalPrice + (payload.rateHourly * duration); // Final price
//   payload.price = price;

//   return payload; // Return updated payload with all the details
// };

// // Main booking service function to handle both one-time and recurring bookings
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

// // Function to check availability for both one-time and recurring bookings
// const checkAvailability = async (contractorId: any, startTime: any, duration: any, days: any, bookingType: any) => {
//   const requestedTimeSlots = generateTimeSlots(startTime, addOneHour(startTime));

//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) throw new Error('Contractor schedule not found');

//   for (const day of days) {
//     let daySchedule;
    
//     // Convert specific date to day name if one-time booking
//     if (bookingType === 'OneTime') {
//       const requestedDay = getDayName(day); // Convert to day name
//       daySchedule = schedule.schedules.find((s) => s.days === requestedDay);
//     } 
//     else if (bookingType === 'Weekly') {
//       daySchedule = schedule.schedules.find((s) => s.days === day); 
//     }

//     if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot) => !daySchedule.timeSlots.includes(slot)
//     );
    
//     if (unavailableSlots.length > 0) {
//       return { available: false, message: 'Requested slots are unavailable.' };
//     }
//   }


//   // Check for overlapping bookings for future recurring or one-time slots
//   const existingBooking = await Booking.findOne({
//     contractorId,
//     days: { $in: days }, // This checks if the requested day matches any day in the booking collection
//     startTime: { $gte: startTime, $lte: addOneHour(startTime) },  // Compare time range
//     status: { $ne: 'cancelled' },
//   });

//   if (existingBooking) {
//     return { available: false, message: 'Time slot is already booked.' };
//   }

//   return { available: true };
// };

// // Function to create a one-time booking
// const createOneTimeBooking = async (updatedPayload: TBooking) => {
//   // Logic to create a one-time booking (insert into DB)
//   const booking = await Booking.create(updatedPayload);
//   return booking;
// };

// // Function to create recurring bookings (for weekly or monthly)
// const createRecurringBookingIntoDB = async (updatedPayload: TBooking) => {
//   const { startTime, days, contractorId, periodInDays } = updatedPayload;
//   // Calculate end time and price (common logic)
//   const updatedBooking = await getBookingDetails(updatedPayload);

//   const futureBookings: any[] = [];
//   const currentDate = new Date();

//  // Calculate the number of weeks to loop (periodInDays / 7)
//   const numOfWeeks = periodInDays / 7;

//   // Create future recurring bookings for the selected days
//   for (let i = 0; i < numOfWeeks; i++) {
//     const bookingDate = new Date(currentDate);
//     bookingDate.setDate(bookingDate.getDate() + (i * 7)); // 7 days for weekly recurrence

//     for (const day of days) {
//       const daySchedule = await MySchedule.findOne({ contractorId });
//       console.log('daySchedule', daySchedule)
//       const requestedTimeSlots = generateTimeSlots(startTime, updatedBooking.endTime);
//       const bookingPayload = {
//         ...updatedBooking,
//         days:day,
//         bookingDate,
//         timeSlots: requestedTimeSlots,
//         recurring: true,
//       };
//       futureBookings.push(bookingPayload);
//     }
//   }

//   // Check for conflicts with existing bookings before creating future bookings
//   for (const booking of futureBookings) {
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       bookingDate: booking.bookingDate,
//       status: { $ne: 'cancelled' },
//     });

//     if (existingBooking) throw new Error('Slot is already booked for the requested date');
//     await Booking.create(booking); // Create new recurring booking
//   }

//   return futureBookings; // Return the created recurring bookings
// };

// // Cron job for automatic renewal of recurring bookings for Customer A

// // Schedule the cron job to run at 11:59 PM on the last day of the month
// cron.schedule('59 23 28-31 * *', async () => {
//   const currentDate = new Date();
//    console.log('currentDate', currentDate)
//   const customers = await getAllCustomersWithRecurringBookings(); // Fetch customers with recurring bookings
//   for (const  customer of customers) {
//     const contractorId = customer?.contractorId;
//     const customerId = customer._id;
    
//     // Automatically renew recurring bookings for the next month
//     await renewRecurringBookingForNextMonth(customerId, contractorId);
//   }

//   console.log('Recurring bookings for the next month created successfully!');
// });

// // Function to renew recurring bookings for Customer A after a period ends
// const renewRecurringBookingForNextMonth = async (customerId:any, contractorId:any) => {
//   const existingBookings = await Booking.find({
//     customerId,
//     contractorId,
//     status: { $ne: 'cancelled' },
//   });

//   const lastBookingDate = existingBookings[existingBookings.length - 1].bookingDate;
//   const newStartDate = new Date(lastBookingDate);
//   newStartDate.setMonth(newStartDate.getMonth() + 1); // Move to the next month

//   // Create new recurring bookings for the next month
//   await createRecurringBookingIntoDB({ ...existingBookings[0], startDate: newStartDate });
// };
///////////////////////////////////////////////////////////////////////
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
// =================================================
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
////////////////////////////////////////////////////===========
// Schedule the cron job to run at 11:59 PM on the last day of the month
// cron.schedule('59 23 28-31 * *', async () => {
//   const currentDate = new Date();
//   console.log('currentDate', currentDate);
//   const customers = await getAllCustomersWithRecurringBookings(); // Fetch customers with recurring bookings
//   for (const customer of customers) {
//     const contractorId = customer?.contractorId;
//     const customerId = customer._id;

//     // Automatically renew recurring bookings for the next month
//     await renewRecurringBookingForNextMonth(customerId, contractorId);
//   }

//   console.log('Recurring bookings for the next month created successfully!');
// });

// // Function to renew recurring bookings for Customer A after a period ends
// const renewRecurringBookingForNextMonth = async (
//   customerId: any,
//   contractorId: any,
// ) => {
//   const existingBookings = await Booking.find({
//     customerId,
//     contractorId,
//     status: { $ne: 'cancelled' },
//   });

//   const lastBookingDate =
//     existingBookings[existingBookings.length - 1].bookingDate;
//   const newStartDate = new Date(lastBookingDate);
//   newStartDate.setMonth(newStartDate.getMonth() + 1); // Move to the next month

//   // Create new recurring bookings for the next month
//   await createRecurringBookingIntoDB({
//     ...existingBookings[0],
//     startDate: newStartDate,
//   });
// };
////////////////////////////////////////////////////===========
// Helper functions for time slot generation, day extraction
// const generateTimeSlots = (startTime: string, endTime: string): string[] => {
//   const timeSlots = [];
//   let currentTime = startTime;

//   while (currentTime < endTime) {
//     const nextTime = addOneHour(currentTime);
//     timeSlots.push(`${currentTime}-${nextTime}`);
//     currentTime = nextTime;
//   }

//   return timeSlots;
// };

// const addOneHour = (time: string): string => {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date(0, 0, 0, hours, minutes);
//   date.setHours(date.getHours() + 1);
//   return `${date.getHours().toString().padStart(2, '0')}:${date
//     .getMinutes()
//     .toString()
//     .padStart(2, '0')}`;
// };
////////////////////
// single booking is working here 


// const checkAvailability = async (
//   contractorId: string,
//   startTime: string,
//   endTime: string,
// days: string | string[], // single date string like "2025-07-14"
//   bookingType: string,
// ) => {
//    console.log('test')

//   const requestedTimeSlots = generateTimeSlots(startTime, endTime);
//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) throw new Error('Contractor schedule not found');
//    console.log('test2')

//   if (bookingType === 'OneTime') {
//     console.log('OneTime')
//     const requestedDate = new Date(days as string); // ex: "2025-07-14"
//     requestedDate.setUTCHours(0, 0, 0, 0); // normalize to 00:00 UTC

//     const dayName = getDayName(days as string); // "Monday"
//     const daySchedule = schedule.schedules.find(s => s.days === dayName);
//     if (!daySchedule) {
//       return { available: false, message: `Contractor is not available on ${dayName}` };
//     }

//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot) => !daySchedule.timeSlots.includes(slot)
//     );
//     if (unavailableSlots.length > 0) {
//       return { available: false, message: 'Requested slots are unavailable.' };
//     }

//     // ✅ Duplicate check using date and time slot match
//     const existingBooking = await Booking.findOne({
//       contractorId,
//       bookingDate: requestedDate, // must match exactly (normalized date)
//       timeSlots: { $in: requestedTimeSlots }, // any overlap
//       status: { $ne: 'cancelled' },
//     });

//     if (existingBooking) {
//       return { available: false, message: 'Time slot is already booked.' };
//     }

//     return { available: true };
//   }

//   // Weekly check — your existing logic can stay
//     if (bookingType === 'weekly') {
//       console.log(days, 'test3')
//     for (const day of days) {
//     const daySchedule = schedule.schedules.find((s) => s.days === day);
//       if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

//       const unavailableSlots = requestedTimeSlots.filter(
//         (slot) => !daySchedule.timeSlots.includes(slot),
//       );
//       if (unavailableSlots.length > 0) {
//         throw new Error('Requested slots are unavailable.');
//       }
//     }

//       // Check for overlapping bookings for future recurring or one-time slots
//   const existingBooking = await Booking.findOne({
//     contractorId,
//     days: { $in: days }, // This checks if the requested day matches any day in the booking collection
//     startTime: { $gte: startTime, $lte: addOneHour(startTime) }, // Compare time range
//     status: { $ne: 'cancelled' },
//   });

//   if (existingBooking) {
//     return { available: false, message: 'Time slot is already booked.' };
//   }
//     }
// };
/////////////
// for the get availale contractors
// {{AMA}}/contractors/available?bookingType=weekly&startTime=14:00&endTime=15:00&duration=1&days=["Monday", "Saturday"]&skills=Electrician&skillsCategory=Electrical&periodInDays=30