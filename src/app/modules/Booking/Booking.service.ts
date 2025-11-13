//===============================================================
/* eslint-disable no-unused-vars */
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
import {
  addOneHour,
  generateTimeSlots,
  getDayName
} from './Booking.utils';
import { User } from '../User/user.model';
import { NotificationServices } from '../Notification/Notification.service';
import { NOTIFICATION_TYPES } from '../Notification/Notification.constant';
import { Contractor } from '../Contractor/Contractor.model';
import { Transaction } from '../Transaction/transaction.model';
import { Notification } from '../Notification/Notification.model';
import { CostAdmin } from '../Dashboard/Dashboard.model';
import config from '../../config';
import Stripe from 'stripe';

const generateBookingId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const stripe = new Stripe(config.stripe_secret_key as string);

// Utility to convert "HH:mm" → minutes
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (mins: number) => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const getAvailableTimesForDate = async (contractorId: string, date: string) => {
  const mySchedule = await MySchedule.findOne({ contractorId }).lean();
  if (!mySchedule) throw new AppError(httpStatus.NOT_FOUND, "Contractor schedule not found");

  const weekday = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long" })
    .trim()
    .toLowerCase();

  const scheduleForDay = mySchedule.schedules.find(
    (s: any) => s.days.toLowerCase() === weekday
  );
  if (!scheduleForDay)
    throw new AppError(httpStatus.BAD_REQUEST, `No schedule found for ${weekday}`);

  const daySlots = scheduleForDay.timeSlots;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const user = await User.findOne({ contractor: contractorId });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "Contractor user not found");
  console.log("Day slots from schedule:", user?._id);

  const existingBookings = await Booking.find({
    contractorId: user?._id.toString(),
    bookingDate: { $gte: dayStart, $lte: dayEnd }
  }).lean();

  console.log("Existing bookings for the day:", existingBookings);

  let freeRanges = daySlots.map((slot: string) => {
    const [start, end] = slot.split("-");
    return [toMinutes(start), toMinutes(end)];
  });

  for (const booking of existingBookings) {
    const start = toMinutes(booking.startTime);
    const end = toMinutes(booking.endTime);

    const updatedRanges: [number, number][] = [];

    for (const [freeStart, freeEnd] of freeRanges) {
      if (end <= freeStart || start >= freeEnd) {
        updatedRanges.push([freeStart, freeEnd]);
      } else {
        if (start > freeStart) updatedRanges.push([freeStart, start]);
        if (end < freeEnd) updatedRanges.push([end, freeEnd]);
      }
    }
    freeRanges = updatedRanges;
  }

  const availableSlots = freeRanges
    .filter(([s, e]) => e - s >= 30)
    .map(([s, e]) => `${toTime(s)}-${toTime(e)}`);

  return {
    success: true,
    message:
      availableSlots.length > 0
        ? `Available time slots for ${weekday}`
        : `No available slots for ${weekday}`,
    availableSlots,
  };
};

const createBookingIntoDB = async (payload: TBooking, user: any) => {
  const { bookingType, contractorId, day, startTime, duration, bookingId } = payload;

  console.log('createBookingIntoDB payload:', payload);

  const [usr, contractor] = await Promise.all([
    User.findOne({ email: user.userEmail }).populate({
      path: "customer",
      select: "location",
    }),
    User.findById(contractorId),
  ]);

  if (!usr) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  if (!contractor)
    throw new AppError(httpStatus.NOT_FOUND, "Contractor not found");

  if (!bookingId) {
    throw new AppError(httpStatus.NOT_FOUND, "bookingId not found");
  }

  payload.customerId = usr._id;

  // const charge = await CostAdmin.findOne({});
  // const adminCostPercent = charge?.cost || 1;
  // const price = Number(payload.totalAmount || 0);
  // const adminChargeAmount = (price * adminCostPercent) / 100;
  // const contractorNetIncome = price - adminChargeAmount;
  // console.log("charge.cost", adminCostPercent)
  // console.log("price", price)
  // console.log("contractorNetIncome", contractorNetIncome)

  payload.totalAmount = Number(payload.totalAmount || 0);

  let selectedLocation = null;
  // @ts-ignore
  if (usr.customer?.location && Array.isArray(usr.customer.location)) {
    // @ts-ignore
    selectedLocation = usr.customer.location.find((loc: any) => loc.isSelect === true);
  }

  if (selectedLocation) {
    const { address, street, detraction, unit } = selectedLocation;
    payload.location = `${address}${street ? `, ${street}` : ''}${unit ? `, ${unit}` : ''}${detraction ? `, ${detraction}` : ''}`;
  } else {
    payload.location = "No location selected";
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const endTime = new Date(0, 0, 0, startHour + duration, startMinute)
    .toTimeString()
    .slice(0, 5);
  payload.endTime = endTime;

  const requestedDays = Array.isArray(day) ? day : [day];

  if (bookingType === 'weekly') {
    const bookingDateAndStatus: any[] = requestedDays.map(d => ({
      status: 'in_complete',
      date: new Date(d),
      image: [],
      materials: [],
      amount: 0,
    }));

    payload.bookingDateAndStatus = bookingDateAndStatus;
  } else {
    payload.bookingDateAndStatus = [];
  }


  const createdBookings = [
    await Booking.create({
      ...payload,
      bookingDate: requestedDays[0],
      status: "pending",
      paymentStatus: "pending",
    }),
  ];

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

  const contractor = await Contractor.findById(contractorId);
  if (!contractor) throw new Error('Contractor not found');

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

  const BookingQuery = new QueryBuilder(
    Booking.find()
      .populate({
        path: 'contractorId',
        populate: {
          path: 'contractor',
          select: 'ratings rateHourly location'
        }
      })
      .populate('subCategoryId', 'name')
      .populate('customerId', 'fullName email img'),
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
  query: Record<string, any>,
  user: any,
) => {
  const { status: stat, page = 1, limit = 10 } = query;

  let status: string[] = [];

  if (stat === 'history') {
    status = ['completed', 'rejected', 'cancelled'];
  } else if (stat) {
    status = [stat];
  }

  const usr = await User.findOne({ email: user.userEmail });
  if (!usr) throw new Error('User not found');

  let filter: Record<string, any> = {};
  let roleField = '';

  if (user.role === 'customer') {
    roleField = 'customerId';
    filter.customerId = usr._id;

  } else if (user.role === 'contractor') {
    if (stat === 'pending') {
      status = ['pending'];
    }
    if (stat === 'home') {
      status = ['pending', 'accepted', 'ongoing'];
    }
    roleField = 'contractorId';
    filter.contractorId = usr._id;
  } else {
    throw new Error('Invalid user role');
  }

  if (status.length) {
    filter.status = { $in: status };
  }

  const total = await Booking.countDocuments(filter);

  const skip = (Number(page) - 1) * Number(limit);
  const totalPage = Math.ceil(total / Number(limit));

  // Fetch bookings
  const bookings = await Booking.find(filter)
    .populate({
      path: 'customerId',
      select: 'fullName email img customerId',
      populate: {
        path: 'customerId',
        select: 'city',
      },
    })
    .populate({
      path: 'contractorId',
      select: 'fullName img contractor email',
      populate: {
        path: 'contractor',
        select: 'ratings',
      },
    })
    .populate('subCategoryId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  bookings.forEach((booking: any) => {
    if (booking?.bookingDateAndStatus?.length) {
      booking.bookingDateAndStatus = booking?.bookingDateAndStatus?.map((bds: any) => ({
        ...bds,
        materials: bds.materials?.map((matId: any) =>
          booking.material.find((m: any) => m._id.toString() === matId.toString())
        ).filter(Boolean),
      }));
    }

  });

  return {
    success: true,
    data: bookings,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage,
    },
  };
};

const getSingleBookingFromDB = async (id: string) => {
  const result = await Booking.findById(id);
  return result;
};

const updateBookingIntoDB = async (id: string, payload: any, files?: any) => {

  const booking = await Booking.findById(id);
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  if (booking.isDeleted) throw new AppError(httpStatus.BAD_REQUEST, 'Cannot update a deleted booking');

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

  if (!updatedBooking) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Booking could not be updated');
  }

  if (updatedBooking.status === 'completed') {

    const contractorData = await Contractor.findOne({ userId: updatedBooking.contractorId.toString() });
    if (!contractorData) throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');

    const price = Number(updatedBooking.totalAmount || 0)
    contractorData.balance = (contractorData.balance ?? 0) + price;

    await Promise.all([contractorData.save()]);

    await NotificationServices.createNotificationIntoDB({
      userId: updatedBooking.customerId,
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      message: 'Your work has been marked as completed',
      bookingId: updatedBooking._id,
      isRead: []
    });
  }

  if (updatedBooking.status === 'cancelled' || updatedBooking.status === 'rejected') {
    try {
      const transaction = await Transaction.findOne({
        bookingId: updatedBooking.bookingId
      });

      if (transaction) {
        const refund = await stripe.refunds.create({
          payment_intent: transaction.transactionId,
        });

        console.log('✅ Refund successful:', refund.id);

        transaction.paymentStatus = 'refunded';
        transaction.refundId = refund.id;
        await transaction.save();

        await updatedBooking.save();

        await NotificationServices.createNotificationIntoDB({
          userId: updatedBooking.customerId,
          type: NOTIFICATION_TYPES.PAYMENT_REFUND,
          title: 'Payment Refunded',
          message: 'Your payment has been refunded due to booking cancellation.',
          bookingId: updatedBooking._id,
          isRead: []
        });
      } else {
        console.warn('⚠️ No transaction found for refund');
      }
    } catch (refundError) {
      console.error('❌ Refund failed:', refundError);
    }
  }

  // 6️⃣ Handle ongoing status
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

const updateWeeklyBookingIntoDB = async (bookingId: string, payload: any, files?: any) => {
  const booking = await Booking.findById(bookingId) as any;
  if (!booking) throw new AppError(httpStatus.NOT_FOUND, "Booking not found");

  const { entryId, status, materials } = payload;

  if (!entryId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Entry ID is required for update");
  }

  // Upload files → store URLs only
  let uploadedUrls: string[] = [];
  if (files && Array.isArray(files) && files.length > 0) {
    uploadedUrls = files.map((file: any) => file.location || file.path);
  }

  // Find entry
  const entryIndex = booking.bookingDateAndStatus.findIndex(
    (entry: any) => entry._id.toString() === entryId
  );

  if (entryIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking date entry not found");
  }

  //  =================================
  let materialsAll = [];
  if (materials) {
    try {
      materialsAll = typeof materials === "string" ? JSON.parse(materials) : materials;
    } catch (err) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid materials format — must be JSON");
    }
  }

  //  ====================================
  if (materialsAll?.length && booking?.material?.length) {
    for (const used of materialsAll) {
      const foundMaterial = booking?.material.find(
        (m: any) => m._id.toString() === used.materialId
      );
      if (foundMaterial) {
        if (foundMaterial.count < used.count) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `Not enough material '${foundMaterial.name}' available. Requested ${used.count}, available ${foundMaterial.count}`
          );
        }

        // Deduct count
        foundMaterial.count -= used.count;

        // If all used → optional: mark as used up
        if (foundMaterial.count === 0) {
          foundMaterial.isUse = true;
        }
      } else {
        throw new AppError(httpStatus.BAD_REQUEST, `${used.materialId} This material is not part of this booking order`);
      }
    }
  }

  // ===========================================
  const rateHourly = booking.rateHourly || 0;
  const duration = booking.duration || 0;
  const baseAmount = rateHourly * duration;

  let materialAmount = 0;
  if (materialsAll?.length) {
    for (const used of materialsAll) {
      const foundMaterial = booking.material.find(
        (m: any) => m._id.toString() === used.materialId
      );
      if (foundMaterial) {
        materialAmount += used.count * foundMaterial.price;
      }
    }
  }

  const amount = baseAmount + materialAmount;

  // ===========================================

  // Update entry fields
  if (status) booking.bookingDateAndStatus[entryIndex].status = status;
  if (materialsAll?.length) booking.bookingDateAndStatus[entryIndex].materials = materialsAll;
  if (amount !== undefined) booking.bookingDateAndStatus[entryIndex].amount = amount;
  if (uploadedUrls.length > 0) {
    booking.bookingDateAndStatus[entryIndex].image = uploadedUrls;
  }

  if (uploadedUrls.length > 0) {
    booking.bookingDateAndStatus[entryIndex].image = uploadedUrls;
  }

  if (uploadedUrls.length > 0) {
    booking.files = [...(booking.files || []), ...uploadedUrls];
  }

  await booking.save();

  if (status === 'completed') {
    const contractorData = await Contractor.findOne({ userId: booking.contractorId.toString() });
    if (!contractorData) throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');

    contractorData.balance = (contractorData.balance ?? 0) + Number(amount);

    await Promise.all([contractorData.save()]);

    await NotificationServices.createNotificationIntoDB({
      userId: booking.customerId,
      type: NOTIFICATION_TYPES.WORK_COMPLETED,
      title: 'Work Completed',
      message: 'Your work has been marked as completed',
      bookingId: booking._id,
      isRead: []
    });
  }

  return {
    success: true,
    message: "Weekly booking updated successfully",
    data: booking,
  };
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

const handlePaymentSuccess = async (metadata: {
  payUser: string;
  bookingId: string;
  amount: string | number;
  stripePaymentIntentId?: string;
  stripeTransactionId?: string;
  stripeChargeId?: string;
  receipt_url: string
}) => {
  try {
    const {
      payUser,
      bookingId,
      amount,
      stripePaymentIntentId,
      receipt_url,
    } = metadata;

    if (!payUser || !bookingId || !amount) {
      return await createDynamicNotification({
        payUser,
        bookingId,
        amount: Number(amount),
        issue: 'missing_metadata',
        receipt_url
      });
    }


    const transaction = await Transaction.create({
      paymentIntentId: stripePaymentIntentId,
      userId: payUser,
      bookingId,
      type: 'booking',
      paymentStatus: 'paid',
      amount: Number(amount),
      receipt_url
    });

    if (!transaction) {
      return await createDynamicNotification({
        payUser,
        bookingId,
        amount: Number(amount),
        issue: 'transaction_failed',
        paymentIntentId: stripePaymentIntentId,
        receipt_url
      });
    }

    // const booking = await Booking.findOneAndUpdate(
    //   { bookingId },
    //   { paymentStatus: 'paid', status: 'ongoing' },
    //   { new: true }
    // );

    // if (!booking) {
    //   return await createDynamicNotification({
    //     payUser,
    //     bookingId,
    //     amount: Number(amount),
    //     issue: 'booking_update_failed',
    //     paymentIntentId: stripePaymentIntentId,
    //     receipt_url
    //   });
    // }

    await createDynamicNotification({
      payUser,
      bookingId,
      amount: Number(amount),
      issue: 'booking_successful',
      paymentIntentId: stripePaymentIntentId,
      receipt_url
    });

    return {
      success: true,
      message: 'Payment processed and booking updated successfully.',
      data: { transaction },
    };
  } catch (error: any) {

    await createDynamicNotification({
      payUser: metadata.payUser,
      issue: 'internal_error',
      bookingId: metadata.bookingId,
      amount: Number(metadata.amount),
      paymentIntentId: metadata.stripePaymentIntentId,
      receipt_url: metadata?.receipt_url
    });

    return { success: false, error: error.message };
  }
};

const handlePaymentSuccessUpdateBooking = async (metadata: {
  payUser: string;
  bookingId: string;
  amount: string | number;
  stripePaymentIntentId?: string;
  stripeTransactionId?: string;
  stripeChargeId?: string;
  receipt_url: string
}) => {
  try {
    const {
      payUser,
      bookingId,
      amount,
      stripePaymentIntentId,
      receipt_url,
    } = metadata;

    if (!payUser || !bookingId || !amount) {
      return await createDynamicNotification({
        payUser,
        bookingId,
        amount: Number(amount),
        issue: 'missing_metadata',
        receipt_url
      });
    }

    const transaction = await Transaction.create({
      paymentIntentId: stripePaymentIntentId,
      userId: payUser,
      bookingId,
      type: 'booking',
      paymentStatus: 'paid',
      amount: Number(amount),
      receipt_url
    });

    if (!transaction) {
      return await createDynamicNotification({
        payUser,
        bookingId,
        amount: Number(amount),
        issue: 'transaction_failed',
        paymentIntentId: stripePaymentIntentId,
        receipt_url
      });
    }

    const charge = await CostAdmin.findOne({});
    const adminCostPercent = charge?.cost || 1;
    const price = Number(amount || 0);
    const adminChargeAmount = (price * adminCostPercent) / 100;
    const addAmount = price - adminChargeAmount;

    const total = Number(addAmount);

    const booking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        $inc: { totalAmount: total },
        $set: { paymentStatus: 'paid', status: 'ongoing' },
      },
      { new: true }
    );

    if (!booking) {
      return await createDynamicNotification({
        payUser,
        bookingId,
        amount: Number(amount),
        issue: 'booking_update_failed',
        paymentIntentId: stripePaymentIntentId,
        receipt_url
      });
    }

    await createDynamicNotification({
      payUser,
      bookingId,
      amount: Number(amount),
      issue: 'booking_update_successful',
      paymentIntentId: stripePaymentIntentId,
      receipt_url
    });

    return {
      success: true,
      message: 'Payment processed and booking updated successfully.',
      data: { transaction, booking },
    };
  } catch (error: any) {
    await createDynamicNotification({
      payUser: metadata.payUser,
      issue: 'internal_error',
      bookingId: metadata.bookingId,
      amount: Number(metadata.amount),
      paymentIntentId: metadata.stripePaymentIntentId,
      receipt_url: metadata?.receipt_url
    });

    return { success: false, error: error.message };
  }
};

// ============================= Helper Function ===========================
const createDynamicNotification = async ({
  payUser,
  issue,
  bookingId,
  amount,
  paymentIntentId,
  receipt_url
}: {
  payUser: string;
  issue: string;
  bookingId?: string;
  amount?: number;
  paymentIntentId?: string;
  receipt_url?: string;
}) => {
  const issueMessages: Record<string, string> = {
    missing_metadata:
      'Your payment was successful, but we detected missing data in your transaction. Please contact support.',
    transaction_failed:
      'Your payment was successful, but we could not record the transaction. Please contact support.',
    booking_update_failed:
      'Your payment was successful, but your booking status was not updated. Please contact support.',
    internal_error:
      'Your payment was successful, but an internal error occurred. Please contact support.',
    booking_successful:
      'Your payment was successfully processed and your booking is now confirmed to ongoing.',
    booking_update_successful:
      'Your payment was successfully processed and your booking has been updated.',
  };

  const notificationType =
    issue === 'booking_successful'
      ? NOTIFICATION_TYPES.SESSION_COMPLETED
      : NOTIFICATION_TYPES.PAYMENT_DISPUTED;

  const baseMessage =
    issueMessages[issue] ||
    'Your payment was successful, but an unknown issue occurred. Please contact support.';

  const message = paymentIntentId
    ? `${baseMessage}\n\nPayment Intent ID: ${paymentIntentId}`
    : baseMessage;

  const not = await Notification.create({
    userId: payUser,
    title:
      issue === 'booking_successful'
        ? 'Payment Successful 🎉'
        : 'Payment Successful (Action Required)',
    type: notificationType,
    message,
    booking: bookingId,
    amount,
    paymentIntentId: paymentIntentId,
    receipt_url,
  });
  console.log('===', not)
  return { success: issue === 'booking_successful', issue, message };
};

// =============================added by rakib==========================
export const BookingServices = {
  updateWeeklyBookingIntoDB,
  getAvailableTimesForDate,
  handlePaymentSuccessUpdateBooking,
  createBookingIntoDB,
  getAllBookingsFromDB,
  getSingleBookingFromDB,
  updateBookingIntoDB,
  deleteBookingFromDB,
  updatePaymentStatusIntoDB,
  checkAvailabilityIntoDB,
  getAllBookingsByUserFromDB,
  handlePaymentSuccess,
  // acceptBookingIntoDB,
  // rejectBookingIntoDB,
  // markWorkCompletedIntoDB,
  // transferPaymentIntoDB
};
