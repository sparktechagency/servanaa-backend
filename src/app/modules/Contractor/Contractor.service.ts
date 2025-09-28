/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../errors/AppError';
import { CONTRACTOR_SEARCHABLE_FIELDS } from './Contractor.constant';
import mongoose from 'mongoose';
import { Contractor } from './Contractor.model';
import { MySchedule } from '../MySchedule/MySchedule.model';
import { Booking } from '../Booking/Booking.model';
import { Review } from '../Review/Review.model';
// import { ObjectId } from 'mongoose';

// Helper function to generate time slots
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
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr); // Convert date string to Date object
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' }; // We want the full name of the weekday
  return new Intl.DateTimeFormat('en-US', options).format(date); // Format the date to get the weekday name
};
// Utility function to check availability
const checkAvailabilityForContractor = async (
  contractorId: string,
  startTime: string,
  endTime: string,
  // duration: number,
  days: any,
  bookingType: string,
  periodInDays: number
) => {
  // console.log(bookingType, 'bookingType');
  const requestedTimeSlots = generateTimeSlots(startTime, endTime);
  const schedule = await MySchedule.findOne({ contractorId });
  // console.log( 'schedule', schedule)

  if (!schedule) throw new Error('Contractor schedule not found');

  // For one-time booking, check for specific date availability
  if (bookingType === 'oneTime') {
    console.log('testingnnn2');
    const requestedDay = getDayName(days as string); // Get the day name for the specific date
    console.log('testingnnn', requestedDay);
    const daySchedule = schedule.schedules.find(s => s.days === requestedDay);
    console.log('daySchedule', daySchedule);
    if (!daySchedule)
      throw new Error(`Contractor is not available on ${requestedDay}`);

    const unavailableSlots = requestedTimeSlots.filter(
      (slot: any) => !daySchedule.timeSlots.includes(slot)
    );
    console.log('unavailableSlots', unavailableSlots);
    if (unavailableSlots.length > 0) {
      // return { available: false, message: 'Requested slots are unavailable.' };
      throw new Error(`Requested slots are unavailable. on ${requestedDay}`);
    }
    console.log('unavailableSlots2', unavailableSlots);
    // Check if there is an existing booking for that specific time slot and day

    console.log('contractorId++++', contractorId);
    console.log('days++++', days);
    console.log('requestedTimeSlots++++', requestedTimeSlots);

    const bookingDate = new Date(days);
    bookingDate.setHours(0, 0, 0, 0); // Normalize to start of the day
    console.log('bookingDate======', bookingDate);

    const nextDay = new Date(bookingDate);

    console.log('nextDay======', nextDay);
    nextDay.setDate(bookingDate.getDate() + 1);

    console.log('nextDay======2', nextDay);
    const existingBooking = await Booking.findOne({
      contractorId,
      bookingDate: { $gte: bookingDate, $lt: nextDay },
      timeSlots: { $in: requestedTimeSlots },
      status: { $ne: 'cancelled' }
    });

    // const existingBooking = await Booking.findOne({
    //   contractorId,
    //   bookingDate: days,  // Check using the exact booking date
    //   timeSlots: { $in: requestedTimeSlots },
    //   status: { $ne: 'cancelled' },
    // });
    console.log('existingBooking+++++', existingBooking);
    if (existingBooking) {
      return { available: false, message: 'Time slot is already booked.' };
    }
  }

  // For weekly booking, check availability for each of the selected days and their future dates
  else if (bookingType === 'weekly') {
    const numOfWeeks = periodInDays / 7; // Calculate the number of weeks based on periodInDays

    for (let i = 0; i < numOfWeeks; i++) {
      const bookingDate = new Date(); // Current date
      bookingDate.setDate(bookingDate.getDate() + i * 7); // Add 7 days for weekly recurrence

      // const daysArray = Array.isArray(days) ? days : [days];

      for (const oneday of days) {
        const daySchedule = schedule.schedules.find(s => s.days === oneday);
        if (!daySchedule) {
          return {
            available: false,
            message: `Contractor is not available on ${oneday}`
          };
        }

        const unavailableSlots = requestedTimeSlots.filter(
          (slot: any) => !daySchedule.timeSlots.includes(slot)
        );

        if (unavailableSlots.length > 0) {
          return {
            available: false,
            message: `Requested slots for ${oneday} are unavailable.`
          };
          // throw new Error(`Requested slots for ${oneday} are unavailable.`)
        }
        // Check for existing bookings for each weekly recurrence
        const existingBooking = await Booking.findOne({
          contractorId,
          bookingDate: bookingDate,
          status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
          return {
            available: false,
            message: `Time slot for ${oneday} is already booked.`
          };
        }
      }
    }
  }

  return { available: true, message: 'Available' };
};

const getAllAvailableContractorsFromDB = async (
  query: Record<string, unknown>
) => {
  const {
    bookingType,
    startTime,
    days,
    skills,
    skillsCategory,
    periodInDays,
    endTime
  } = query;

  const contractors = await Contractor.find({
    skills: { $in: [skills] },
    skillsCategory: skillsCategory
  }).populate('myScheduleId');

  if (contractors.length <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'There is no Contractor for this skills and categories'
    );
  }
  // Array to hold available contractors
  const availableContractors: any = [];
  // console.log(availableContractors, 'availableContractors')

  let parsedDays: string | string[];

  if (bookingType === 'weekly') {
    // Expecting an array of weekday names
    try {
      parsedDays = typeof days === 'string' ? JSON.parse(days) : days;
      if (!Array.isArray(parsedDays)) throw new Error();
    } catch {
      throw new Error(
        'Invalid format for days. Expected an array for weekly booking.'
      );
    }
  } else if (bookingType === 'oneTime') {
    console.log(days, 'now I am trying to parse days');
    // Expecting a string date
    if (typeof days !== 'string') {
      throw new Error(
        'Invalid format for days. Expected a string date for oneTime booking.'
      );
    }
    parsedDays = days;
  } else {
    throw new Error('Invalid bookingType');
  }

  for (const contractor of contractors) {
    const availability = await checkAvailabilityForContractor(
      contractor._id.toString(),
      startTime as string,
      endTime as string,
      // duration as number,
      parsedDays as any,
      // parsedDays as string[],
      bookingType as string,
      periodInDays as number // Added periodInDays for weekly checks
    );

    if (availability.available) {
      availableContractors.push(contractor);
    }
  }

  return {
    result: availableContractors,
    meta: {
      total: availableContractors.length
    }
  };
  // const ContractorQuery = new QueryBuilder(
  //   Contractor.find(),
  //   query,
  // )
  //   .search(CONTRACTOR_SEARCHABLE_FIELDS)
  //   .filter()
  //   .sort()
  //   .paginate()
  //   .fields();

  // const result = await ContractorQuery.modelQuery;
  // const meta = await ContractorQuery.countTotal();
  // return {
  //   result,
  //   meta,
  // };
};

const getAllContractorsFromDB = async (query: Record<string, unknown>) => {
  const ContractorQuery = new QueryBuilder(
    Contractor.find().populate('userId'), // userId is a User reference
    query
  )
    .search(CONTRACTOR_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const contractors = await ContractorQuery.modelQuery;

  const result = await Promise.all(
    contractors.map(async contractorDoc => {
      const contractor = contractorDoc.toObject();

      const userId = contractor.userId?._id || contractor.userId;

      // Ensure it's an ObjectId
      const contractorUserId = new mongoose.Types.ObjectId(userId);

      const reviews = await Review.find({ contractorId: contractorUserId });

      // console.log(`Found ${reviews.length} reviews for contractor userId ${contractorUserId}`);

      const totalRatings = reviews.length;
      const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
      const averageRating = totalRatings > 0 ? totalStars / totalRatings : 0;

      contractor.ratings = Number(averageRating.toFixed(1));

      return contractor;
    })
  );

  const meta = await ContractorQuery.countTotal();

  return {
    result,
    meta
  };
};

const getSingleContractorFromDB = async (id: string) => {
  const result = await Contractor.findById(id).populate('myScheduleId');

  return result;
};
const updateContractorIntoDB = async (id: string, payload: any) => {
  const isDeletedService = await mongoose.connection
    .collection('contractors')
    .findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { isDeleted: 1 } }
    );

  if (!isDeletedService) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Contractor');
  }

  const updatedData = await Contractor.findByIdAndUpdate({ _id: id }, payload, {
    new: true,
    runValidators: true
  });

  if (!updatedData) {
    throw new Error('Contractor not found after update');
  }

  return updatedData;
};
const deleteContractorFromDB = async (id: string) => {
  const deletedService = await Contractor.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!deletedService) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete Contractor');
  }

  return deletedService;
};

export const ContractorServices = {
  getAllContractorsFromDB,
  getSingleContractorFromDB,
  updateContractorIntoDB,
  deleteContractorFromDB,
  getAllAvailableContractorsFromDB
};
