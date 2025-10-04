// /* eslint-disable no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import httpStatus from 'http-status';
// import QueryBuilder from '../../builder/QueryBuilder';
// import AppError from '../../errors/AppError';
// import { BOOKING_SEARCHABLE_FIELDS } from './Booking.constant';
// import { DaySchedule, TBooking } from './Booking.interface';
// import { Booking } from './Booking.model';
// import { MySchedule } from '../MySchedule/MySchedule.model';
// import {
//   addOneHour,
//   checkAvailability,
//   checkOrderDate,
//   createOneTimeBooking,
//   createRecurringBookingIntoDB,
//   generateTimeSlots,
//   getBookingDetails,
//   getDayName
// } from './Booking.utils';
// import { User } from '../User/user.model';
// import { NotificationServices } from '../Notification/Notification.service';
// import { NOTIFICATION_TYPES } from '../Notification/Notification.constant';
// import { Contractor } from '../Contractor/Contractor.model';
// import { Customer } from '../Customer/Customer.model';

// const createBookingIntoDB = async (payload: TBooking, usr: any) => {


//   const user = await User.findOne({ email: usr.userEmail });
//     if (!user) {
//       throw new Error('User not found or user ID is missing');
//     }
//     payload.customerId = user._id;

//   const { bookingType, contractorId, day: days, bookingDate } = payload;

//   // Handle oneTime booking
//   if (bookingType === 'oneTime') {
//     console.log('Processing oneTime booking...');

//     // Determine the actual booking date
//     let actualBookingDate = bookingDate;

//     if (!actualBookingDate) {
//       // If bookingDate is missing, try to construct it from the day field
//       if (typeof days === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(days)) {
//         actualBookingDate = new Date(days + 'T00:00:00.000Z');
//         // console.log(
//         //   'Constructed bookingDate from day field:',
//         //   actualBookingDate
//         // );
//       } else {
//         throw new Error(
//           'For oneTime bookings, either bookingDate or day in YYYY-MM-DD format is required'
//         );
//       }
//     }

//     // Validate the bookingDate
//     const bookingDateObj = new Date(actualBookingDate);
//     if (isNaN(bookingDateObj.getTime())) {
//       throw new Error('Invalid bookingDate provided');
//     }

//     // Use bookingDate for validation
//     const dateString = bookingDateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD format
//     // console.log('Date string for validation:', dateString);

//     // Check if the order date is valid
//     try {
//       checkOrderDate(dateString, bookingType);
//     } catch (error) {
//       console.error('Date validation failed:', error);
//       throw error;
//     }

//     // Get booking details with proper calculations
//     let updatedPayload: TBooking;
//     try {
//       updatedPayload = await getBookingDetails(payload);
//       // console.log('Updated payload after getBookingDetails:', updatedPayload);
//     } catch (error) {
//       console.error('Error getting booking details:', error);
//       throw error;
//     }

//     // Check availability
//     const availabilityResult = await checkAvailability(
//       contractorId,
//       updatedPayload.startTime,
//       dateString,
//       bookingType
//     );

//     // console.log('Availability check result:', availabilityResult);

//     if (!availabilityResult?.available) {
//       throw new Error(availabilityResult?.message || 'Booking not available');
//     }

//     // Set the proper values for oneTime booking
//     const requestedDate = new Date(actualBookingDate);
//     requestedDate.setUTCHours(0, 0, 0, 0);
//     const dayName = getDayName(dateString);

//     // Update the payload with correct date and day
//     updatedPayload.bookingDate = requestedDate;
//     updatedPayload.day = dayName;

//     // console.log('Final payload before creating booking:', {
//     //   bookingDate: updatedPayload.bookingDate,
//     //   day: updatedPayload.day,
//     //   startTime: updatedPayload.startTime,
//     //   endTime: updatedPayload.endTime,
//     //   price: updatedPayload.price
//     // });

//     // Create the booking
//     let booking: any;
//     try {
//       booking = await createOneTimeBooking(updatedPayload);
//       // console.log('Booking created successfully:', booking._id);
//     } catch (error) {
//       // console.error('Error creating booking:', error);
//       throw error;
//     }

//     if (!booking) {
//       throw new Error('Failed to create booking');
//     }

//       const customerData = await Customer.findById(booking.customerId);
//       if(!customerData) throw new Error('No customer found');
//       customerData.balance = (customerData.balance || 0) + (booking.price || 0);
//       await customerData.save();

//     // Create notifications
//     const notifications = [];

//     // Notification for contractor
//     notifications.push({
//       userId: booking.contractorId.toString(),
//       type: NOTIFICATION_TYPES.BOOKING_REQUEST,
//       title: 'New Booking Request',
//       message: `New ${bookingType} booking request received for ${dayName}`,
//       bookingId: booking._id.toString(),
//       isRead: []
//     });

//     // Notifications for admins
//     try {
//       const admins = await User.find({ role: 'superAdmin' });
//       for (const admin of admins) {
//         notifications.push({
//           userId: admin._id.toString(),
//           type: NOTIFICATION_TYPES.BOOKING_REQUEST,
//           title: 'New Booking Request',
//           message: `New booking request from customer requires attention`,
//           bookingId: booking._id.toString(),
//           isRead: []
//         });
//       }
//     } catch (error) {
//       // console.error('Error fetching admins for notifications:', error);
//       // Don't throw error here, just log it as notifications are not critical
//     }

//     // Create all notifications
//     for (const notification of notifications) {
//       try {
//         await NotificationServices.createNotificationIntoDB(notification);
//       } catch (error) {
//         // console.error('Error creating notification:', error);
//         // Continue with other notifications even if one fails
//       }
//     }

//     // console.log('OneTime booking process completed successfully');
//     return booking;
//   }

//   // Handle weekly booking
//   else if (bookingType === 'weekly') {
//     // console.log('Processing weekly booking...');

//     // Validate days for weekly booking
//     if (!days || (typeof days === 'string' && !Array.isArray(days))) {
//       throw new Error('Days are required for weekly bookings');
//     }

//     const daysArray = Array.isArray(days) ? days : [days];

//     // Validate each day
//     for (const day of daysArray) {
//       try {
//         checkOrderDate(day, bookingType);
//       } catch (error) {
//         // console.error(`Date validation failed for day ${day}:`, error);
//         throw error;
//       }
//     }

//     // Get booking details
//     let updatedPayload: TBooking;
//     try {
//       updatedPayload = await getBookingDetails(payload);
//       // console.log('Updated payload for weekly booking:', updatedPayload);
//     } catch (error) {
//       // console.error('Error getting booking details for weekly:', error);
//       throw error;
//     }

//     // Check availability for all days
//     for (const day of daysArray) {
//       const availabilityResult = await checkAvailability(
//         contractorId,
//         updatedPayload.startTime,
//         day,
//         bookingType
//       );

//       // console.log(`Availability check result for ${day}:`, availabilityResult);

//       if (!availabilityResult?.available) {
//         throw new Error(
//           availabilityResult?.message || `Booking not available for ${day}`
//         );
//       }
//     }

//     // Create recurring bookings
//     let bookings: any[];
//     try {
//       bookings = await createRecurringBookingIntoDB(updatedPayload);
//       // console.log(`Created ${bookings.length} recurring bookings`);
//     } catch (error) {
//       // console.error('Error creating recurring bookings:', error);
//       throw error;
//     }

//     // Create notifications for weekly booking
//     if (bookings && bookings.length > 0) {
//       const notifications = [];

//       // Notification for contractor
//       notifications.push({
//         userId: bookings[0].contractorId.toString(),
//         type: NOTIFICATION_TYPES.BOOKING_REQUEST,
//         title: 'New Weekly Booking Request',
//         message: `New ${bookingType} booking request received for ${daysArray.join(
//           ', '
//         )}`,
//         bookingId: bookings[0]._id ? bookings[0]._id.toString() : '',
//         isRead: []
//       });

//       // Notifications for admins
//       try {
//         const admins = await User.find({ role: 'superAdmin' });
//         for (const admin of admins) {
//           notifications.push({
//             userId: admin._id.toString(),
//             type: NOTIFICATION_TYPES.BOOKING_REQUEST,
//             title: 'New Weekly Booking Request',
//             message: `New weekly booking request from customer requires attention`,
//             bookingId: bookings[0]._id ? bookings[0]._id.toString() : '',
//             isRead: []
//           });
//         }
//       } catch (error) {
//         console.error('Error fetching admins for weekly notifications:', error);
//       }

//       // Create all notifications
//       for (const notification of notifications) {
//         try {
//           await NotificationServices.createNotificationIntoDB(notification);
//         } catch (error) {
//           // console.error('Error creating weekly notification:', error);
//         }
//       }
//     }

//     // console.log('Weekly booking process completed successfully');
//     return bookings;
//   }
// };

// const checkAvailabilityIntoDB = async (
//   contractorId: any,
//   startTime: any,
//   duration: any,
//   days: any,
//   bookingType: any
// ) => {
//   const requestedTimeSlots = generateTimeSlots(
//     startTime,
//     addOneHour(startTime)
//   );

//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) throw new Error('Contractor schedule not found');

//   for (const day of days) {
//     let daySchedule: any;

//     // Convert specific date to day name if one-time booking
//     // Fix: Change 'OneTime' to 'oneTime'
//     if (bookingType === 'oneTime') {
//       const requestedDay = getDayName(day); // Convert to day name
//       daySchedule = schedule.schedules.find(
//         (s: any) => s.days === requestedDay
//       );
//     }
//     // Fix: Change 'Weekly' to 'weekly'
//     else if (bookingType === 'weekly') {
//       daySchedule = schedule.schedules.find((s: any) => s.days === day);
//     }

//     if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot: string) => !daySchedule.timeSlots.includes(slot)
//     );

//     console.log('unavailableSlotsmm', unavailableSlots);

//     if (unavailableSlots.length === 0) {
//       return { available: false, message: 'Requested slots are unavailable.' };
//     }
//   }

//   // Check for overlapping bookings for future recurring or one-time slots
//   const existingBooking = await Booking.findOne({
//     contractorId,
//     day: { $in: days }, // This checks if the requested day matches any day in the booking collection
//     startTime: { $gte: startTime, $lte: addOneHour(startTime) }, // Compare time range
//     status: { $ne: 'cancelled' }
//   });

//   if (existingBooking) {
//     return { available: false, message: 'Time slot is already booked.' };
//   }

//   return { available: true };
// };

// const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
//  console.log('getAllBookingsFromDB query:', query);

//   const BookingQuery = new QueryBuilder(
//     Booking.find()
//       .populate({
//         path: 'contractorId', // Populate contractorId
//         populate: {
//           path: 'contractor', // Populate contractor field inside contractorId
//           select: 'ratings rateHourly' // Specify the fields you want from contractor
//         }
//       })
//       .populate('subCategoryId', 'name'),
//     query
//   )
//     .search(BOOKING_SEARCHABLE_FIELDS)
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await BookingQuery.modelQuery;
//   const meta = await BookingQuery.countTotal();

//   console.log('result=========', result);

//   return {
//     result,
//     meta
//   };
// };

// const getAllBookingsByUserFromDB = async (
//   query: Record<string, unknown>,
//   user: any
// ) => {
//   console.log('ahmad Musa');

//   const usr = await User.findOne({ email: user.userEmail }).select('_id role');
//   // console.log('usr', usr)
//   const b: any = {};

//   if (user.role === 'customer') {
//     b.customerId = usr?._id;
//   }

//   if (user.role === 'contractor') {
//     b.contractorId = usr?._id;
//   }

//   const BookingQuery = new QueryBuilder(
//     Booking.find(b)
//       .populate('customerId')
//       .populate('contractorId')
//       .populate('subCategoryId'),
//     query
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
//     meta
//   };
// };

// const getSingleBookingFromDB = async (id: string) => {
//   const result = await Booking.findById(id).populate(
//     'contractorId subCategoryId'
//   );
//   return result;
// };

// const updateBookingIntoDB = async (id: string, payload: any, files?: any) => {
//   const booking = await Booking.findById(id);
//   if (!booking) throw new Error('Booking not found');

//   if (files && files.length > 0) {
//     // const fileUrls = files.map((file: any) => file.location); // Extract S3 URLs
//     payload.files = files; // Assuming file.location contains the S3 URL
//   }

//   if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');



//   const updatedData = await Booking.findByIdAndUpdate({ _id: id }, payload, {
//     new: true,
//     runValidators: true
//   });
//  if (!updatedData) {
//     throw new Error('Booking cannot update');
//   }
//   if(updatedData?.status === 'completed'){
//       console.log('completed');
//       // Notify contractor of payment transfer

//       const contractorData = await Contractor.findById(updatedData.contractorId);
//       const customerData = await Customer.findById(updatedData.customerId);
//       if(!customerData) throw new Error('No customer found');
//       if(!contractorData) throw new Error('No contractor found');

//       contractorData.balance = (contractorData.balance || 0) + (updatedData.price || 0);
//       customerData.balance = (customerData?.balance ?? 0) - (updatedData.price || 0);
//       await contractorData.save();
//       await customerData.save();


//       await NotificationServices.createNotificationIntoDB({
//         userId: updatedData.customerId,
//         type: NOTIFICATION_TYPES.WORK_COMPLETED,
//         title: 'Work Completed',
//         message: 'Your work has been marked as completed',
//         bookingId: updatedData._id,
//         isRead: []
//       });
//   }

//     if(updatedData?.status === 'ongoing'){
//       // console.log('completed');
//       // Notify contractor of payment transfer

//       // const contractorData = await Contractor.findById(updatedData.contractorId);
//       // if(!contractorData) throw new Error('No contractor found');
//       // contractorData.balance = (contractorData.balance || 0) + (updatedData.price || 0);
//       // await contractorData.save();


//       await NotificationServices.createNotificationIntoDB({
//         userId: updatedData.customerId,
//         type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
//         title: 'Work Accepted',
//         message: 'Your work has been Started',
//         bookingId: updatedData._id,
//         isRead: []
//       });
//   }


//   return updatedData;
// };

// const updatePaymentStatusIntoDB = async (id: string, payload: any) => {
//   const booking = await Booking.findOne({
//     customerId: id,
//     paymentStatus: 'pending'
//   });

//   if (!booking) throw new Error('Booking not found');
//   if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');

//   // add new payment status
//   const update = { paymentStatus: payload.paymentStatus };
//   const updatedData = await Booking.findByIdAndUpdate(
//     { _id: booking._id },
//     update,
//     { new: true, runValidators: true }
//   );

//   return updatedData;
// };

// const deleteBookingFromDB = async (id: string) => {
//   const deletedService = await Booking.findByIdAndDelete(id, { new: true });

//   if (!deletedService) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Booking');
//   }

//   return deletedService;
// };

// // =============================added by rakib==========================

// // Accept booking (Contractor only)
// const acceptBookingIntoDB = async (id: string, contractorUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { status: 'accepted' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify customer of acceptance
//   await NotificationServices.createNotificationIntoDB({
//     userId: booking.customerId,
//     type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
//     title: 'Booking Accepted',
//     message: 'Your booking request has been accepted by the contractor',
//     bookingId: booking._id,
//     isRead: []
//   });

//   return booking;
// };

// // Reject booking (Contractor only)
// const rejectBookingIntoDB = async (
//   id: string,
//   reason: string,
//   contractorUser: any
// ) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { status: 'rejected' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify customer of rejection
//   await NotificationServices.createNotificationIntoDB({
//     userId: booking.customerId,
//     type: NOTIFICATION_TYPES.BOOKING_REJECTED,
//     title: 'Booking Rejected',
//     message: `Your booking request was rejected. Reason: ${reason}`,
//     bookingId: booking._id,
//     isRead: []
//   });

//   return booking;
// };

// // Mark work completed (Customer only)
// const markWorkCompletedIntoDB = async (id: string, customerUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { status: 'completed' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify all admins for payment processing
//   const admins = await User.find({ role: 'superAdmin' });

//   for (const admin of admins) {
//     await NotificationServices.createNotificationIntoDB({
//       userId: admin._id,
//       type: NOTIFICATION_TYPES.WORK_COMPLETED,
//       title: 'Work Completed',
//       message: 'Customer marked work as completed - ready for payment transfer',
//       bookingId: booking._id,
//       isRead: []
//     });
//   }

//   return booking;
// };

// // Transfer payment (Admin only)
// const transferPaymentIntoDB = async (id: string, adminUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { paymentStatus: 'paid' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify contractor of payment transfer
//   await NotificationServices.createNotificationIntoDB({
//     userId: booking.contractorId,
//     type: NOTIFICATION_TYPES.PAYMENT_TRANSFERRED,
//     title: 'Payment Transferred',
//     message: 'Payment for completed work has been transferred to your account',
//     bookingId: booking._id,
//     isRead: []
//   });

//   return booking;
// };

// export const BookingServices = {
//   createBookingIntoDB,
//   getAllBookingsFromDB,
//   getSingleBookingFromDB,
//   updateBookingIntoDB,
//   deleteBookingFromDB,
//   updatePaymentStatusIntoDB,
//   checkAvailabilityIntoDB,
//   getAllBookingsByUserFromDB,
//   acceptBookingIntoDB,
//   rejectBookingIntoDB,
//   markWorkCompletedIntoDB,
//   transferPaymentIntoDB
// };
/////////////////////////////////////////////////////////////
//===============================================================
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

const createBookingIntoDB = async (payload: TBooking, user:any) => {

  const { bookingType, contractorId, day: days } = payload;


  const usr = await User.findOne({ email: user.userEmail });
    if (!usr) {
      throw new Error('User not found or user ID is missing');
    }
    payload.customerId = usr._id;

  // Step 1: Get booking details (end time, price, rateHourly, etc.)

  const updatedPayload = await getBookingDetails(payload);

  // Step 2: Check availability (this will handle both one-time and recurring bookings)
  const result = await checkAvailability(
    contractorId,
    updatedPayload.startTime,
    days,
    bookingType
  );

  console.log('Availability check result:', result);

  if (!result?.available) {
    throw new Error('Booking date not available');
  }

  // Step 3: Create the booking (either one-time or recurring)
  if (bookingType === 'oneTime') {
    const requestedDate = new Date(days as string); // ex: "2025-07-14"
    requestedDate.setUTCHours(0, 0, 0, 0); // normalize to 00:00 UTC
    const dayName = getDayName(days as string); // "Monday"

    updatedPayload.bookingDate = requestedDate;
    updatedPayload.day = dayName;
    const booking = await createOneTimeBooking(updatedPayload); // Create one-time booking
    return booking;
  } else if (bookingType === 'weekly') {
    const booking = await createRecurringBookingIntoDB(updatedPayload); // Create recurring bookings
    return booking;
  }
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
      (slot: any) => !daySchedule.timeSlots.includes(slot)
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
    status: { $ne: 'cancelled' }
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
    meta
  };
};
const getAllBookingsByUserFromDB = async (
  query: Record<string, unknown>,
  user: any
) => {

  // console.log('ahmad Musa');
  console.log( 'ahmad Musa req iser', user);

  const usr = await User.findOne({ email: user.userEmail });
  // console.log('usr', usr)
  // const b: any = {};


    console.log( 'ahmad Musa', usr);

  // if (user.role === 'customer') {
  //   // b.customerId = usr?._id;
   
  //   const BookingQuery = new QueryBuilder(
  //   Booking.find({customerId:usr?._id}).populate('customerId'),
  //   query
  // )
  //   .search(BOOKING_SEARCHABLE_FIELDS)
  //   .filter()
  //   .sort()
  //   .paginate()
  //   .fields();
  // const result = await BookingQuery.modelQuery;
  // const meta = await BookingQuery.countTotal();
  // return {
  //   result,
  //   meta
  // };

  // }

  if (user.role === 'contractor') {
    // b.contractorId = usr?._id;
      const conData = await Contractor.findOne({ userId: usr?._id });
  console.log( 'ahmad Musa contractor', usr?._id);

const BookingQuery = new QueryBuilder(
    Booking.find({contractorId:conData?._id}),
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

  }

  
};

const getSingleBookingFromDB = async (id: string) => {
  const result = await Booking.findById(id);
  return result;
};

const updateBookingIntoDB = async (id: string, payload: any, files?: any) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new Error('Booking not found');

  if (booking.isDeleted) throw new Error('Cannot update a deleted Booking');
  console.log('payload', payload);
  const updatedData = await Booking.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true
  });
  console.log('updatedData', updatedData);

  if (!updatedData) {
    throw new Error('Booking cannot update');
  }

  if (updatedData?.status === 'completed') {
    console.log('completed');

    const contractorData = await Contractor.findById(updatedData.contractorId);

    const userData = await User.findById(updatedData.customerId).populate('customer');
    const customerData = await Customer.findById(userData?.customer);
    console.log('customerData', customerData);
    if (!customerData) throw new Error('No customer found');
    if (!contractorData) throw new Error('No contractor found');

    
    customerData.balance =
      (customerData?.balance ?? 0) - (updatedData.price || 0);
      await customerData.save();
    contractorData.balance =
      (contractorData.balance || 0) + (updatedData.price || 0);
    await contractorData.save();

    await NotificationServices.createNotificationIntoDB({
      userId: updatedData.customerId,
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      message: 'Your work has been marked as completed',
      bookingId: updatedData._id,
      isRead: []
    });
  }

  if (updatedData?.status === 'ongoing') {
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
    customerId: id,
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
// const acceptBookingIntoDB = async (id: string, contractorUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(id);

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // -------- START WEEKLY BOOKING LOGIC --------

//   if (booking.bookingType === 'weekly' && booking.recurring) {
//     const occurrences = await Booking.find({
//       parentBookingId: id,
//       bookingType: 'Weekly'
//     });

//     // Update status of all occurrences to "accepted"
//     for (const occurrence of occurrences) {
//       occurrence.status = 'accepted';
//       await occurrence.save();
//     }

//     // Update status of the parent booking itself
//     booking.status = 'accepted';
//     await booking.save();
//   } else {
//     booking.status = 'accepted';
//     await booking.save();
//   }
//   // -------- END WEEKLY BOOKING LOGIC --------

//   // --------- NOTIFICATIONS SECTION ---------
//   // Get customer user
//   const customer = await User.findById(booking.customerId);
//   // Get all admins
//   const admins = await User.find({ role: 'superAdmin' });

//   // Notify Customer
//   if (customer) {
//     await NotificationServices.createNotificationIntoDB({
//       userId: customer._id,
//       title: 'Booking Accepted',
//       type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
//       message: 'Your weekly booking has been accepted by the contractor.',
//       bookingId: booking._id,
//       isDeleted: false,
//       isRead: []
//     });
//   }

//   // Notify All Admins
//   for (const admin of admins) {
//     await NotificationServices.createNotificationIntoDB({
//       userId: admin._id,
//       title: 'Weekly Booking Accepted',
//       type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
//       message: `Weekly booking ${booking._id} has been accepted by contractor ${
//         contractorUser.userEmail || contractorUser._id
//       }.`,
//       bookingId: booking._id,
//       isDeleted: false,
//       isRead: []
//     });
//   }

//   // --------- END NOTIFICATIONS SECTION ---------

//   return booking;
// };

// // Reject booking (Contractor only)
// const rejectBookingIntoDB = async (
//   id: string,
//   reason: string,
//   contractorUser: any
// ) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { status: 'rejected' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify customer of rejection
//   await NotificationServices.createNotificationIntoDB({
//     userId: booking.customerId,
//     type: NOTIFICATION_TYPES.BOOKING_REJECTED,
//     title: 'Booking Rejected',
//     message: `Your booking request was rejected. Reason: ${reason}`,
//     bookingId: booking._id,
//     isRead: []
//   });

//   return booking;
// };

// // Mark work completed (Customer only)
// const markWorkCompletedIntoDB = async (id: string, customerUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { status: 'completed' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify all admins for payment processing
//   const admins = await User.find({ role: 'superAdmin' });

//   for (const admin of admins) {
//     await NotificationServices.createNotificationIntoDB({
//       userId: admin._id,
//       type: NOTIFICATION_TYPES.WORK_COMPLETED,
//       title: 'Work Completed',
//       message: 'Customer marked work as completed - ready for payment transfer',
//       bookingId: booking._id,
//       isRead: []
//     });
//   }

//   return booking;
// };

// // Transfer payment (Admin only)
// const transferPaymentIntoDB = async (id: string, adminUser: any) => {
//   const booking = await Booking.findByIdAndUpdate(
//     id,
//     { paymentStatus: 'paid' },
//     { new: true }
//   );

//   if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');

//   // Notify contractor of payment transfer
//   await NotificationServices.createNotificationIntoDB({
//     userId: booking.contractorId,
//     type: NOTIFICATION_TYPES.PAYMENT_TRANSFERRED,
//     title: 'Payment Transferred',
//     message: 'Payment for completed work has been transferred to your account',
//     bookingId: booking._id,
//     isRead: []
//   });

//   return booking;
// };

export const BookingServices = {
  createBookingIntoDB,
  getAllBookingsFromDB,
  getSingleBookingFromDB,
  updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB,
  checkAvailabilityIntoDB,
  getAllBookingsByUserFromDB,
  // acceptBookingIntoDB,
  // rejectBookingIntoDB,
  // markWorkCompletedIntoDB,
  // transferPaymentIntoDB
};
