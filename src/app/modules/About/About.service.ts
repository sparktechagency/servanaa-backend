/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TAbout } from './About.interface';
import { About } from './About.model';

const createAboutIntoDB = async (
  payload: TAbout,
) => {


    // Check if a About already exists based on a unique field (e.g., About name or code)
    const existingAbout = await About.find({ }); // or use another unique field like 'code'
    if (existingAbout[0]) {
      // If a About exists, update it with the new payload
      const updatedTerm = await About.findByIdAndUpdate(existingAbout[0]._id, payload, { new: true  });
      return updatedTerm;  
    }
  
    // If the About doesn't exist, create a new one
    const result = await About.create(payload);
  
    if (!result) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create About');
    }
  
    return result;  // Return the created About
};


const getSingleAboutFromDB = async () => {
  const results = await About.find();
  const result = results[0]
  return result;
};



export const AboutServices = {
  createAboutIntoDB,
  getSingleAboutFromDB,
};
