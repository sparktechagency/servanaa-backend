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
  generateTimeSlots,
  getDayName
} from './Booking.utils';
import { User } from '../User/user.model';
import { NotificationServices } from '../Notification/Notification.service';
import { NOTIFICATION_TYPES } from '../Notification/Notification.constant';
import { Contractor } from '../Contractor/Contractor.model';
import { Customer } from '../Customer/Customer.model';
const generateBookingId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const createBookingIntoDB = async (payload: TBooking, user: any) => {
  const { bookingType, contractorId, day, startTime, duration } = payload;

  const [usr, contractor] = await Promise.all([
    User.findOne({ email: user.userEmail }),
    User.findById(contractorId),
  ]);

  if (!usr) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  if (!contractor)
    throw new AppError(httpStatus.NOT_FOUND, "Contractor not found");

  payload.customerId = usr._id;

  const mySchedule = await MySchedule.findOne({ contractorId: contractor.contractor?.toString() }).lean();
  if (!mySchedule)
    throw new AppError(httpStatus.NOT_FOUND, "Contractor schedule not found");

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const endTime = new Date(0, 0, 0, startHour + duration, startMinute)
    .toTimeString()
    .slice(0, 5);
  payload.endTime = endTime;

  const requestedDays = Array.isArray(day) ? day : [day];

  await Promise.all(
    requestedDays.map(async (d) => {
      const weekday = new Date(d).toLocaleDateString("en-US", {
        weekday: "long",
      });

      const scheduleForDay = mySchedule.schedules.find(
        (s: any) => s.days === weekday
      );
      if (!scheduleForDay)
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Contractor has no schedule for ${weekday}`
        );

      const slotAvailable = scheduleForDay.timeSlots.some((slot: string) => {
        const [slotStart, slotEnd] = slot.split("-");
        return startTime >= slotStart && endTime <= slotEnd;
      });

      if (!slotAvailable)
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Time ${startTime}-${endTime} unavailable on ${weekday}`
        );

      const overlappingBooking = await Booking.findOne({
        contractorId,
        bookingDate: new Date(d),
        isDeleted: false,
        $or: [
          {
            $and: [
              { startTime: { $lt: endTime } },
              { endTime: { $gt: startTime } },
            ],
          },
        ],
      }).lean();

      if (overlappingBooking)
        throw new AppError(
          httpStatus.CONFLICT,
          `A booking already exists between ${overlappingBooking.startTime} and ${overlappingBooking.endTime} on ${d}`
        );
    })
  );
  const bookingId = generateBookingId();
  const createdBookings =
    bookingType === "weekly" && requestedDays.length > 1
      ? await Booking.insertMany(
        requestedDays.map((d) => ({
          ...payload,
          bookingDate: d,
          bookingId,
          status: "pending",
          paymentStatus: "pending",
        }))
      )
      : [
        await Booking.create({
          ...payload,
          bookingDate: requestedDays[0],
          bookingId,
          status: "pending",
          paymentStatus: "pending",
        }),
      ];

  // 🔔 Send notifications asynchronously (non-blocking)
  (async () => {
    try {
      const admins = await User.find({ role: "superAdmin" }).lean();

      const notifPromises: Promise<any>[] = [];

      for (const booking of createdBookings) {
        const dayName = new Date(booking.bookingDate).toLocaleDateString(
          "en-US",
          { weekday: "long" }
        );

        // Contractor notification
        notifPromises.push(
          NotificationServices.createNotificationIntoDB({
            userId: booking.contractorId.toString(),
            type: NOTIFICATION_TYPES.BOOKING_REQUEST,
            title: "New Booking Request",
            message: `You have a new ${bookingType} booking request for ${dayName}`,
            bookingId: booking._id.toString(),
            isRead: [],
          })
        );

        // Admin notifications
        for (const admin of admins) {
          notifPromises.push(
            NotificationServices.createNotificationIntoDB({
              userId: admin._id.toString(),
              type: NOTIFICATION_TYPES.BOOKING_REQUEST,
              title: "New Booking Request",
              message: `A new booking request from ${usr.fullName || usr.email
                } requires attention`,
              bookingId: booking._id.toString(),
              isRead: [],
            })
          );
        }
      }

      await Promise.allSettled(notifPromises);
    } catch (err) {
      console.error("❌ Error sending notifications:", err);
    }
  })();

  return {
    success: true,
    message: "Booking created successfully",
    data: createdBookings,
  };
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

    if (bookingType === 'OneTime') {
      const requestedDay = getDayName(day);
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
};

const getAllBookingsFromDB = async (query: Record<string, unknown>) => {
  console.log('getAllBookingsFromDB query:', query);

  const BookingQuery = new QueryBuilder(
    Booking.find()
      .populate({
        path: 'contractorId',
        populate: {
          path: 'contractor',
          select: 'ratings rateHourly'
        }
      })
      .populate('subCategoryId', 'name')
      .populate('customerId', 'fullName img'),
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
const getAllBookingsByUserFromDB = async (
  query: Record<string, unknown>,
  user: any
) => {

  // console.log('ahmad Musa');
  console.log('ahmad Musa req iser', user);

  const usr = await User.findOne({ email: user.userEmail });
  // console.log('usr', usr)
  // const b: any = {};


  console.log('ahmad Musa', usr);

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
    console.log('ahmad Musa contractor', usr?._id);

    const BookingQuery = new QueryBuilder(
      Booking.find({ contractorId: conData?._id }),
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
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.isDeleted)
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot update a deleted booking');
  console.log('payload', id);

  const updateData: any = { ...payload };

  if (files && Array.isArray(files) && files.length > 0) {
    const uploadedFiles = files.map((file: any) => ({
      name: file.originalname || file.filename,
      url: file.location || file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    updateData.files = [...(booking.files || []), ...uploadedFiles];
  }

  const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!updatedBooking)
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking could not be updated');


  if (updatedBooking.status === 'completed') {
    const contractorData = await Contractor.findById(updatedBooking.contractorId);
    const customerData = await Customer.findById(updatedBooking.customerId);

    if (!contractorData) throw new Error('No contractor found');
    if (!customerData) throw new Error('No customer found');


    customerData.balance =
      (customerData?.balance ?? 0) - (updatedBooking.price || 0);
    await customerData.save();
    contractorData.balance =
      (contractorData.balance || 0) + (updatedBooking.price || 0);
    customerData.balance =
      (customerData.balance ?? 0) - (updatedBooking.price || 0);

    await contractorData.save();
    await customerData.save();

    await NotificationServices.createNotificationIntoDB({
      userId: updatedBooking.customerId,
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      message: 'Your work has been marked as completed',
      bookingId: updatedBooking._id,
      isRead: []
    });
  }

  if (updatedBooking.status === 'ongoing') {
    await NotificationServices.createNotificationIntoDB({
      userId: updatedBooking.customerId,
      type: NOTIFICATION_TYPES.BOOKING_ACCEPTED,
      title: 'Work Accepted',
      message: 'Your work has started',
      bookingId: updatedBooking._id,
      isRead: []
    });
  }

  return updatedBooking;
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
