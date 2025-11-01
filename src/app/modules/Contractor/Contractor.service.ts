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
import { User } from '../User/user.model';
import { Support } from './Support.model';
import { Customer } from '../Customer/Customer.model';
import { SendEmail } from '../../utils/sendEmail';
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

// const getAllContractorsFromDB = async (query: Record<string, any>) => {
//   const aggregatePipeline: any[] = [];

//   // -----------------------------
//   // Step 1: Geo query using $geoNear
//   // -----------------------------
//   let lng: number | null = null;
//   let lat: number | null = null;

//   if (query.customerId) {
//     console.log('query.customerId', query.customerId);
//     const user = await User.findById(query.customerId) as any;
//     if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');
//     const customer = await Customer.findById(user.customer.toString());
//     if (!customer) throw new AppError(httpStatus.NOT_FOUND, 'Customer not found');

//     //@ts-ignore
//     const selectedLocation = customer.location.find(loc => loc.isSelect);
//     if (selectedLocation) {
//       [lng, lat] = selectedLocation.coordinates;

//       // @ts-ignore
//       if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
//         throw new AppError(httpStatus.BAD_REQUEST, 'Invalid coordinates for Geo query');
//       }

//       // Ensure 2dsphere index exists
//       await Contractor.collection.createIndex({ location: '2dsphere' });

//       const maxDistanceKm =  100;
//       const maxDistanceMeters = maxDistanceKm * 1000;

//       aggregatePipeline.push({
//         $geoNear: {
//           near: { type: 'Point', coordinates: [lng, lat] },
//           distanceField: 'distance',
//           spherical: true,
//           maxDistance: maxDistanceMeters,
//         },
//       });
//     }
//   } else {
//     aggregatePipeline.push({ $match: { isDeleted: false } });
//   }

//   // -----------------------------
//   // Step 2: Exclude unwanted fields
//   // -----------------------------
//   aggregatePipeline.push({
//     $project: {
//       certificates: 0,
//       createdAt: 0,
//       updatedAt: 0,
//       hasActiveSubscription: 0,
//       subscriptionId: 0,
//       isDeleted: 0,
//     },
//   });

//   // -----------------------------
//   // Step 3: Search
//   // -----------------------------
//   if (query.search) {
//     const searchStr = query.search as string;
//     aggregatePipeline.push({
//       $match: {
//         $or: [
//           { city: { $regex: searchStr, $options: 'i' } },
//           { skillsCategory: { $regex: searchStr, $options: 'i' } },
//           { skills: { $regex: searchStr, $options: 'i' } },
//         ],
//       },
//     });
//   }

//   // -----------------------------
//   // Step 4: Filter by category / subCategory
//   // -----------------------------
//   if (query.category) {
//     aggregatePipeline.push({
//       $match: { category: new mongoose.Types.ObjectId(query.category as string) },
//     });
//   }

//   if (query.subCategory) {
//     aggregatePipeline.push({
//       $match: { subCategory: new mongoose.Types.ObjectId(query.subCategory as string) },
//     });
//   }

//   if (query?.isHomeSelect) {
//     aggregatePipeline.push({
//       $match: { isHomeSelect: true },
//     });
//   }

//   // -----------------------------
//   // Step 5: Pagination
//   // -----------------------------
//   const page = query.page ? Number(query.page) : 1;
//   const limit = query.limit ? Number(query.limit) : 10;
//   const skip = (page - 1) * limit;

//   aggregatePipeline.push({ $skip: skip }, { $limit: limit });

//   // -----------------------------
//   // Step 6: Lookup & populate references
//   // -----------------------------
//   aggregatePipeline.push(
//     // userId
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'userId',
//         foreignField: '_id',
//         as: 'userId',
//       },
//     },
//     { $addFields: { userId: { $arrayElemAt: ['$userId', 0] } } },
//     // category
//     {
//       $lookup: {
//         from: 'categories',
//         localField: 'category',
//         foreignField: '_id',
//         as: 'category',
//       },
//     },
//     { $addFields: { category: { $arrayElemAt: ['$category', 0] } } },
//     // subCategory
//     {
//       $lookup: {
//         from: 'subcategories',
//         localField: 'subCategory',
//         foreignField: '_id',
//         as: 'subCategory',
//       },
//     }
//   );

//   // -----------------------------
//   // Step 7: Execute aggregation
//   // -----------------------------
//   const contractors = await Contractor.aggregate(aggregatePipeline);

//   // -----------------------------
//   // Step 8: Calculate ratings
//   // -----------------------------
//   const result = await Promise.all(
//     contractors.map(async contractor => {
//       const contractorUserId = new mongoose.Types.ObjectId(contractor.userId?._id || contractor.userId);
//       const reviews = await Review.find({ contractorId: contractorUserId });
//       const totalRatings = reviews.length;
//       const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
//       contractor.ratings = totalRatings > 0 ? Number((totalStars / totalRatings).toFixed(1)) : 0;
//       return contractor;
//     })
//   );

//   // -----------------------------
//   // Step 9: Get total count for meta
//   // -----------------------------
//   const countPipeline = aggregatePipeline.filter(stage => !('$skip' in stage || '$limit' in stage));
//   const metaCount = await Contractor.aggregate([...countPipeline, { $count: 'total' }]);
//   const total = metaCount[0]?.total || 0;
//   const totalPage = Math.ceil(total / limit);

//   return { result, meta: { page, limit, total, totalPage } };
// };

const getAllContractorsFromDB = async (query: Record<string, any>) => {
  const aggregatePipeline: any[] = [];
  let lng: number | null = null;
  let lat: number | null = null;
  // ===========================================
  // Step 1: Get customer coordinates
  // ===========================================
  if (query.customerId) {
    const user = await User.findById(query.customerId);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

    const customer = await Customer.findById(user.customer?.toString());
    if (!customer) throw new AppError(httpStatus.NOT_FOUND, "Customer not found");

    //@ts-ignore
    const selectedLocation = customer.location?.find((loc) => loc.isSelect);
    if (!selectedLocation) {
      throw new AppError(httpStatus.BAD_REQUEST, "Customer location not found or not selected");
    }

    [lng, lat] = selectedLocation.coordinates;
    // @ts-ignore
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid coordinates for Geo query");
    }

    await Contractor.collection.createIndex({ location: "2dsphere" });
    // ===========================================
    // Step 2: $geoNear with dynamic radius
    // ===========================================
    aggregatePipeline.push({
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        spherical: true,
        maxDistance: 50 * 1000, // max search 50 km
      },
    });

    aggregatePipeline.push({
      $addFields: {
        allowedDistance: {
          $cond: {
            if: { $eq: ["$subscriptionStatus", "active"] },
            then: 50 * 1000, // 50 km
            else: 5 * 1000, // 5 km
          },
        },
      },
    });

    aggregatePipeline.push({
      $match: {
        $expr: { $lte: ["$distance", "$allowedDistance"] },
        isDeleted: false,
      },
    });
  } else {
    aggregatePipeline.push({ $match: { isDeleted: false } });
  }
  // ===========================================
  // Step 3: Exclude unwanted fields
  // ===========================================
  aggregatePipeline.push({
    $project: {
      certificates: 0,
      createdAt: 0,
      updatedAt: 0,
      hasActiveSubscription: 0,
      subscriptionId: 0,
      isDeleted: 0,
    },
  });
  // ===========================================
  // Step 4: Search
  // ===========================================
  if (query.search) {
    const searchStr = query.search as string;
    aggregatePipeline.push({
      $match: {
        $or: [
          { city: { $regex: searchStr, $options: "i" } },
          { skillsCategory: { $regex: searchStr, $options: "i" } },
          { skills: { $regex: searchStr, $options: "i" } },
        ],
      },
    });
  }
  // ===========================================
  // Step 5: Filter by category / subCategory
  // ===========================================
  if (query.category) {
    aggregatePipeline.push({
      $match: { category: new mongoose.Types.ObjectId(query.category as string) },
    });
  }
  if (query.subCategory) {
    aggregatePipeline.push({
      $match: { subCategory: new mongoose.Types.ObjectId(query.subCategory as string) },
    });
  }
  if (query.isHomeSelect) {
    aggregatePipeline.push({ $match: { isHomeSelect: true } });
  }
  // ===========================================
  // Step 6: Pagination
  // ===========================================
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;
  aggregatePipeline.push({ $skip: skip }, { $limit: limit });

  // ===========================================
  // Step 7: Populate references
  // ===========================================
  aggregatePipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      },
    },
    { $addFields: { userId: { $arrayElemAt: ["$userId", 0] } } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $addFields: { category: { $arrayElemAt: ["$category", 0] } } },
    {
      $lookup: {
        from: "subcategories",
        localField: "subCategory",
        foreignField: "_id",
        as: "subCategory",
      },
    },
    {
      $lookup: {
        from: "myschedules", // <-- collection name in MongoDB (check actual collection name)
        localField: "myScheduleId",
        foreignField: "_id",
        as: "myScheduleId",
      },
    },
  );
  // ===========================================
  // Step 8: Execute aggregation
  // ===========================================
  const contractorsWithDistance = await Contractor.aggregate(aggregatePipeline);
  // ===========================================
  // Step 9: Calculate ratings
  // ===========================================
  const result = await Promise.all(
    contractorsWithDistance.map(async (contractor) => {
      const contractorUserId = new mongoose.Types.ObjectId(contractor.userId?._id || contractor.userId);
      const reviews = await Review.find({ contractorId: contractorUserId });
      const totalRatings = reviews.length;
      const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
      contractor.ratings = totalRatings > 0 ? Number((totalStars / totalRatings).toFixed(1)) : 0;
      return contractor;
    })
  );
  // ===========================================
  // Step 10: Pagination meta
  // ===========================================
  const countPipeline = aggregatePipeline.filter((stage) => !("$skip" in stage || "$limit" in stage));
  const metaCount = await Contractor.aggregate([...countPipeline, { $count: "total" }]);
  const total = metaCount[0]?.total || 0;
  const totalPage = Math.ceil(total / limit);

  return { result, meta: { page, limit, total, totalPage } };
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
  try {
    payload.skills = JSON.parse(payload.skills || '[]');
  } catch {
    payload.skills = [];
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

// ==================================================

const createMaterials = async (email: string, payload: any) => {
  // Find contractor using user's email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const contractor = await Contractor.findOne({ userId: user._id }) as any;
  if (!contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');
  }

  if (Array.isArray(payload)) {
    contractor?.materials.push(...payload);
  } else {
    contractor?.materials.push(payload);
  }

  console.log(contractor)

  await contractor.save();
  return contractor.materials;
};

const updateMaterials = async (email: string, payload: any) => {
  console.log("==", payload)
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const contractor = await Contractor.findOne({ userId: user._id }) as any;
  if (!contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contractor not found');
  }

  const { id, name, unit, price } = payload;



  const materialIndex = contractor.materials.findIndex(
    (mat: any) => mat._id.toString() === id
  );

  if (materialIndex === -1) {
    throw new AppError(httpStatus.NOT_FOUND, 'Material not found');
  }

  // Update the existing material
  if (name !== undefined) contractor.materials[materialIndex].name = name;
  if (unit !== undefined) contractor.materials[materialIndex].unit = unit;
  if (price !== undefined) contractor.materials[materialIndex].price = price;

  await contractor.save();
  return contractor.materials;
};

const deleteMaterials = async (_id: string) => {
  console.log('deleteMaterials called with id:', _id);

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid material ID format');
  }

  const contractor = await Contractor.findOne({ 'materials._id': _id });

  if (!contractor) {
    throw new AppError(httpStatus.NOT_FOUND, 'Material not found');
  }

  // @ts-ignore
  contractor.materials = contractor.materials.filter(
    (mat: any) => mat._id.toString() !== _id
  );

  await contractor.save();

  return contractor.materials;
};

const createSupport = async (email: string, payload: any) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  let createData = { ...payload };
  createData.userId = user?._id;

  const support = await Support.create(createData) as any;
  if (!support) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Support not updated!');
  }

  if (support) {
    console.log("Sending email to:", user.email);
    await SendEmail.sendSupportRequestToAdmin(email, user.fullName, payload.title, payload.details);
  }


  return support;
}

const getAllSupport = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.searchTerm) {
    const searchRegex = { $regex: query.searchTerm, $options: 'i' };
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const [supports, total] = await Promise.all([
    Support.find(filter)
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Support.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: supports,
  };
};






export const ContractorServices = {
  createSupport,
  getAllSupport,
  createMaterials,
  updateMaterials,
  deleteMaterials,
  getAllContractorsFromDB,
  getSingleContractorFromDB,
  updateContractorIntoDB,
  deleteContractorFromDB,
  getAllAvailableContractorsFromDB
};
