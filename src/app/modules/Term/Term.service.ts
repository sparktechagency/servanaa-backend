/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TTerm } from './Term.interface';
import { Term } from './Term.model';

const createTermIntoDB = async (
  payload: TTerm,
) => {
  // Check if a term already exists based on a unique field (e.g., term name or code)
  const existingTerm = await Term.find({ }); // or use another unique field like 'code'
  if (existingTerm[0]) {
    // If a term exists, update it with the new payload
    const updatedTerm = await Term.findByIdAndUpdate(existingTerm[0]._id, payload, { new: true });
    return updatedTerm;  // Return the updated term
  }

  // If the term doesn't exist, create a new one
  const result = await Term.create(payload);

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create Term');
  }

  return result;  // Return the created term
};

const getSingleTermFromDB = async () => {
  const results = await Term.find();
  const result = results[0]

  return result;
};



export const TermServices = {
  createTermIntoDB,
  getSingleTermFromDB,

};
