// // contractor.service.ts
// import { MySchedule } from '../models/MySchedule';  // Import MySchedule model
// import { Contractor } from '../models/Contractor';  // Import Contractor model
// import { Booking } from '../models/Booking';  // Import Booking model
// import { generateTimeSlots, getDayName } from '../utils/helpers';  // Utility functions for generating time slots

// const getAllAvailableContractorsFromDB = async (query: Record<string, unknown>) => {
//   const { bookingType, startTime, duration, days, contractorCategory } = query;
//   const futureBookings: any[] = [];
  
//   // Find contractors based on filters (e.g., category, active status, etc.)
//   const contractors = await Contractor.find({
//     category: contractorCategory,
//     isDeleted: false,
//   });

//   // Loop through each contractor to check availability
//   const availableContractors = [];

//   for (const contractor of contractors) {
//     const availability = await checkAvailabilityForContractor(
//       contractor._id,
//       startTime,
//       duration,
//       days,
//       bookingType
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
// };

// // Utility function to check availability
// const checkAvailabilityForContractor = async (
//   contractorId: string,
//   startTime: string,
//   duration: number,
//   days: string[],
//   bookingType: string
// ) => {
//   const requestedTimeSlots = generateTimeSlots(startTime, addOneHour(startTime));

//   const schedule = await MySchedule.findOne({ contractorId });
//   if (!schedule) throw new Error('Contractor schedule not found');

//   // Check availability for each selected day (based on booking type)
//   for (const day of days) {
//     const daySchedule = schedule.schedules.find(s => s.day === day);
//     if (!daySchedule) throw new Error(`Contractor is not available on ${day}`);
    
//     // Check if requested time slots are available for each day
//     const unavailableSlots = requestedTimeSlots.filter(
//       (slot) => !daySchedule.timeSlots.includes(slot)
//     );

//     if (unavailableSlots.length > 0) {
//       return { available: false, message: 'Requested slots are unavailable.' };
//     }
//   }

//   // Check if the requested time is already booked in the booking collection
//   const existingBooking = await Booking.findOne({
//     contractorId,
//     startTime: { $gte: startTime, $lte: addOneHour(startTime) },
//     status: { $ne: 'cancelled' },
//   });

//   if (existingBooking) {
//     return { available: false, message: 'Time slot is already booked.' };
//   }

//   return { available: true };  // Available if no conflicts are found
// };

// // Helper function to generate time slots
// const generateTimeSlots = (startTime: string, endTime: string) => {
//   const timeSlots = [];
//   let currentTime = startTime;

//   while (currentTime < endTime) {
//     const nextTime = addOneHour(currentTime);
//     timeSlots.push(`${currentTime}-${nextTime}`);
//     currentTime = nextTime;
//   }

//   return timeSlots;
// };

// // Helper function to add one hour to the time string
// const addOneHour = (time: string): string => {
//   const [hours, minutes] = time.split(':').map(Number);
//   const date = new Date(0, 0, 0, hours, minutes);
//   date.setHours(date.getHours() + 1);
//   return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
// };

// export { getAllAvailableContractorsFromDB, checkAvailabilityForContractor };
