/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { BOOKING_SEARCHABLE_FIELDS } from './Booking.constant';
import { TBooking } from './Booking.interface';
import { Booking } from './Booking.model';
// import { Notification } from '../Notification/Notification.model';

const createBookingIntoDB = async (
  payload: TBooking,
) => {
    // console.log(booking, 'booking');

  const result = await Booking.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Booking');
  }
  // if (result) {

  //   const notificationPayload = {
  //     clientId: result.clientId,
  //     title: 'booking_request',
  //     bookingId: result._id,
  //     message: 'A new booking request has been made',
  //     isRead: false,
  //     isDeleted: false,
  //   };

  //   const notification = await Notification.create(notificationPayload);

  //   if (!notification) {
  //     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Notification');
  //   }

  // }
  
  return result;
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

// const updateBookingIntoDB = async (id: string, payload: any) => {
//   const booking = await Booking.findById(id);

//   if (!booking) throw new Error("Booking not found");
//   if (booking.isDeleted) throw new Error("Cannot update a deleted Booking");


//   // Store previous status to compare later
//   const prevStatus = booking.status;

//   // Merge payload fields, including nested frequency if present
//   for (const key in payload) {
//     if (!payload.hasOwnProperty.call(payload,key)) continue;
//     const value = payload[key];
//     if (typeof value === 'object' && value !== null && !Array.isArray(value) && key === 'frequency') {
//       // merge frequency fields instead of overwrite
//       booking.frequency = {
//         ...booking.frequency.toObject(),
//         ...value,
//       }; 
//     } else {
//       (booking as any)[key] = value;
//     }
//   }
  

//    // Check if status changed
//   if (payload.status && payload.status !== prevStatus) {
//     // Define notification message and type based on new status
//     let notificationType = '';
//     let notificationMessage = '';

//     switch (payload.status) {
//       case 'completed':
//         notificationType = 'booking_complete';
//         notificationMessage = `Booking #${booking._id} has been completed.`;
//         break;
//       case 'cancelled':
//         notificationType = 'booking_cancel';
//         notificationMessage = `Booking #${booking._id} has been cancelled.`;
//         break;
//       case 'ongoing':
//         notificationType = 'booking_confirm';
//         notificationMessage = `Booking #${booking._id} is now ongoing.`;
//         break;
//       // Add other statuses if needed
//       default:
//         break;
//     }

//     if (notificationType) {
//       await Notification.create({
//         clientId: booking.clientId,   // or booking.userId, depends on your schema
//         title: notificationType,
//         bookingId: booking._id,
//         message: notificationMessage,
//         isRead: false,
//         isDeleted: false,
//         createdAt: new Date(),
//       });
//     }
//   }


    
//   await booking.save();

//   return booking;
// };
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
    // { isDeleted: true },
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
  // updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB
  // getAllBookingsByUserFromDB
};
