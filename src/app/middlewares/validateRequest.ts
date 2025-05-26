import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import catchAsync from '../utils/catchAsync';
// import catchAsync from '..\utils\catchAsync\index.ts';

const validateRequest = (schema: AnyZodObject) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.parseAsync({
      body: req.body,
      cookies: req.cookies,
    });
    req.body = result.body;
    next();
  });
};

export default validateRequest;
