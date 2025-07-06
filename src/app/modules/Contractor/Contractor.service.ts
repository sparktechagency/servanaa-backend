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
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export const getDayName = (dateStr: string):string => {
  const date = new Date(dateStr);  // Convert date string to Date object
  const options: Intl.DateTimeFormatOptions = { weekday: 'long' };  // We want the full name of the weekday
  return new Intl.DateTimeFormat('en-US', options).format(date);  // Format the date to get the weekday name
};

// Utility function to check availability
const checkAvailabilityForContractor = async (
  contractorId: string,
  startTime: string,
  endTime: string,
  duration: number,
  days: string | string[],
  bookingType: string,
  periodInDays: number
) => {


if (!mongoose.Types.ObjectId.isValid(contractorId)) {
  console.log('Invalid contractorId provided');
  return { available: false, message: 'Invalid contractorId provided' };
}


  // console.log(bookingType, 'bookingType');
  const requestedTimeSlots = generateTimeSlots(startTime, endTime);
  const schedule = await MySchedule.findOne({ contractorId });
  
  if (!schedule) throw new Error('Contractor schedule not found');

  // For one-time booking, check for specific date availability
  if (bookingType === 'oneTime') {
    const requestedDay = getDayName(days as string); // Get the day name for the specific date
    const daySchedule = schedule.schedules.find(s => s.days === requestedDay);
    if (!daySchedule) throw new Error(`Contractor is not available on ${requestedDay}`);

    const unavailableSlots = requestedTimeSlots.filter(
      slot => !daySchedule.timeSlots.includes(slot)
    );

    if (unavailableSlots.length > 0) {
      return { available: false, message: 'Requested slots are unavailable.' };
    }

    // Check if there is an existing booking for that specific time slot and day
    const existingBooking = await Booking.findOne({
      contractorId,
      bookingDate: days,  // Check using the exact booking date
      timeSlots: { $in: requestedTimeSlots },
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      return { available: false, message: 'Time slot is already booked.' };
    }
  } 

   // For weekly booking, check availability for each of the selected days and their future dates
  else if (bookingType === 'weekly') {
    const numOfWeeks = periodInDays / 7; // Calculate the number of weeks based on periodInDays

    for (let i = 0; i < numOfWeeks; i++) {
      const bookingDate = new Date(); // Current date
      bookingDate.setDate(bookingDate.getDate() + (i * 7)); // Add 7 days for weekly recurrence

      for (const day of days) {
        const daySchedule = schedule.schedules.find(s => s.days === day);
        if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);

        const unavailableSlots = requestedTimeSlots.filter(
          slot => !daySchedule.timeSlots.includes(slot)
        );

        if (unavailableSlots.length > 0) {
          return { available: false, message: `Requested slots for ${day} are unavailable.` };
        }

        // Check for existing bookings for each weekly recurrence
        const existingBooking = await Booking.findOne({
          contractorId,
          bookingDate: bookingDate,
          status: { $ne: 'cancelled' },
        });

        if (existingBooking) {
          return { available: false, message: `Time slot for ${day} is already booked.` };
        }
      }
    }
  }
  return { available: true, message: 'Available' };
};



// const getAllAvailableContractorsFromDB = async (query: Record<string, unknown>) => {
//   const { bookingType, startTime, duration, days, skills, skillsCategory, periodInDays, endTime } = query;
//   const futureBookings: any[] = [];
//   console.log(futureBookings, 'futureBookings')
  
//   // Find contractors based on skills and category filters
//   const contractors = await Contractor.find({
//     skills: skills,
//     skillsCategory: skillsCategory,
//   });

//   // Array to hold available contractors
//   const availableContractors = [];

//   for (const contractor of contractors) {
//     const availability = await checkAvailabilityForContractor(
//       contractor._id.toString(),
//       startTime as string,
//       endTime as string,
//       duration as number,
//       days as string | string[], 
//       bookingType as string,
//       periodInDays as number // Added periodInDays for weekly checks
//     );

//     if (availability.available) {
//       availableContractors.push(contractor);
//     }
//   }

//   return {
//     result: availableContractors,
//     meta: {
//       total: availableContractors.length,
//     },
//   };
//   // const ContractorQuery = new QueryBuilder(
//   //   Contractor.find(),
//   //   query,
//   // )
//   //   .search(CONTRACTOR_SEARCHABLE_FIELDS)
//   //   .filter()
//   //   .sort()
//   //   .paginate()
//   //   .fields();

//   // const result = await ContractorQuery.modelQuery;
//   // const meta = await ContractorQuery.countTotal();
//   // return {
//   //   result,
//   //   meta,
//   // };
// };

const getAllAvailableContractorsFromDB = async (query: Record<string, unknown>) => {
  console.log(query, 'query')


  const { bookingType, startTime, duration, days, skills, skillsCategory, periodInDays, endTime } = query;
  
  // Use QueryBuilder for basic querying: skills, skillsCategory, etc.
  const ContractorQuery = new QueryBuilder(
    Contractor.find({
    skills: skills,
    skillsCategory: skillsCategory,
  }),
    query
  )
    .search(['skills', 'skillsCategory']) // Adjust this as per your fields
    .filter()
    .sort()
    .paginate()
    .fields();

  const contractors = await ContractorQuery.modelQuery; // Retrieve contractors
  const meta = await ContractorQuery.countTotal();

  const availableContractors = [];

  // Now check availability manually using the contractor's schedule
  for (const contractor of contractors) {
    // Call the checkAvailabilityForContractor for each contractor
    const availability = await checkAvailabilityForContractor(
      contractor._id.toString(),
      startTime as string,
      endTime as string,
      duration as number,
      days as string | string[],
      bookingType as string,
      periodInDays as number
    );

    // If the contractor is available, add them to the list
    if (availability.available) {
      availableContractors.push(contractor);
    }
  }

  return {
    result: availableContractors,
    meta, // Include pagination meta-data
  };
};




const getAllContractorsFromDB = async (query: Record<string, unknown>) => {
  const ContractorQuery = new QueryBuilder(
    Contractor.find(),
    query,
  )
    .search(CONTRACTOR_SEARCHABLE_FIELDS)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await ContractorQuery.modelQuery;
  const meta = await ContractorQuery.countTotal();
  return {
    result,
    meta,
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
      { projection: { isDeleted: 1, name: 1 } },
    );

  if (!isDeletedService?.name) {
    throw new Error('Contractor not found');
  }

  if (isDeletedService.isDeleted) {
    throw new Error('Cannot update a deleted Contractor');
  }

  const updatedData = await Contractor.findByIdAndUpdate(
    { _id: id },
    payload,
    { new: true, runValidators: true },
  );

  if (!updatedData) {
    throw new Error('Contractor not found after update');
  }

  return updatedData;
};

const deleteContractorFromDB = async (id: string) => {
  const deletedService = await Contractor.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
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
  getAllAvailableContractorsFromDB,
  checkAvailabilityForContractor 
};
