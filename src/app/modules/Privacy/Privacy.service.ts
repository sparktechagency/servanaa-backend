/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TPrivacy } from './Privacy.interface';
import { Privacy } from './Privacy.model';

const createPrivacyIntoDB = async (
  payload: TPrivacy,
) => {
   // Check if a privacy already exists based on a unique field (e.g., privacy name or code)
   const existingTerm = await Privacy.find({ }); // or use another unique field like 'code'
   if (existingTerm[0]) {
     // If a privacy exists, update it with the new payload
     const updatedTerm = await Privacy.findByIdAndUpdate(existingTerm[0]._id, payload, { new: true });
     return updatedTerm;  // Return the updated privacy
   }
 
   // If the privacy doesn't exist, create a new one
   const result = await Privacy.create(payload);
 
   if (!result) {
     throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create privacy');
   }
 
   return result;  // Return the created privacy
};

const getSinglePrivacyFromDB = async () => {
  const results = await Privacy.find();
  const result = results[0]

  return result;
};


export const PrivacyServices = {
  createPrivacyIntoDB,
  getSinglePrivacyFromDB,

};
