/* eslint-disable @typescript-eslint/no-unused-vars */
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
 const { startTime, duration } = payload;

 // Convert startTime to a Date object
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0); // Set the start time to the specified hour and minute

// Calculate endTime by adding duration (in hours) to startTime
  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000); // Multiply duration (in hours) by milliseconds
  // Format endTime as HH:mm (ensuring it is returned in the same format as startTime)
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

// Step 2: Calculate the price
  const materialTotalPrice = payload.material.reduce((total, material) => total + material.price, 0); // Sum up all material prices
  const price = materialTotalPrice + (payload.rateHourly * duration); // Add hourly rate multiplied by the duration to the total material price

  // Step 3: Add endTime and price to payload
  payload.endTime = endTime;
  payload.price = price;


  if(payload.bookingType === 'Just Once'){
    console.log(payload, 'booking');
    console.log( endTime,"endDate" )
    console.log( price,"price" )

  }

  const result = await Booking.create(payload);
  
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Booking');
  }

    return result;
};
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
  
//   return result;
// };

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



  // Store previous status to compare later
  // const prevStatus = booking.status;

  // Merge payload fields, including nested frequency if present
  // for (const key in payload) {
  //   if (!payload.hasOwnProperty.call(payload,key)) continue;
  //   const value = payload[key];
  //   if (typeof value === 'object' && value !== null && !Array.isArray(value) && key === 'frequency') {
  //     // merge frequency fields instead of overwrite
  //     booking.frequency = {
  //       ...booking.frequency.toObject(),
  //       ...value,
  //     }; 
  //   } else {
  //     (booking as any)[key] = value;
  //   }
  // }
  

   // Check if status changed
  // if (payload.status && payload.status !== prevStatus) {
  //   // Define notification message and type based on new status
  //   let notificationType = '';
  //   let notificationMessage = '';

  //   switch (payload.status) {
  //     case 'completed':
  //       notificationType = 'booking_complete';
  //       notificationMessage = `Booking #${booking._id} has been completed.`;
  //       break;
  //     case 'cancelled':
  //       notificationType = 'booking_cancel';
  //       notificationMessage = `Booking #${booking._id} has been cancelled.`;
  //       break;
  //     case 'ongoing':
  //       notificationType = 'booking_confirm';
  //       notificationMessage = `Booking #${booking._id} is now ongoing.`;
  //       break;
  //     // Add other statuses if needed
  //     default:
  //       break;
  //   }

  //   if (notificationType) {
  //     await Notification.create({
  //       clientId: booking.clientId,   // or booking.userId, depends on your schema
  //       title: notificationType,
  //       bookingId: booking._id,
  //       message: notificationMessage,
  //       isRead: false,
  //       isDeleted: false,
  //       createdAt: new Date(),
  //     });
  //   }
  // }


    
  // await booking.save();

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
  updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB
  // getAllBookingsByUserFromDB
};
