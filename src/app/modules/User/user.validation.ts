import { z } from 'zod';

export const createUserValidationSchema = z.object({
  body: z.object({
    user: z.object({
      fullName: z.string().min(1, 'Full name is required'), // Required field
      contactNo: z.string()
        .min(10, 'Contact number must be at least 10 digits')
        .max(15, 'Contact number cannot exceed 15 digits').optional(), // Adjust min/max as needed
      email: z.string().email('Invalid email format').min(1, 'Email is required'), // Required field with email validation
      myBalance: z.object({
        deposit: z.number().default(0),
        refund: z.number().default(0)
      }).optional(),
      password: z.string().min(5, 'Password must be at least 5 characters'), // Required field
      passwordChangedAt: z.date().optional(), // Optional
      role: z.enum(['client', 'superAdmin', 'provider']).default('client'), // Enum with default value
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format').optional(), // Optional field with regex for date format
      otpVerified: z.boolean().default(false), // Optional with default value
      status: z.enum(['active', 'inactive', 'pending', 'blocked']).default('active'), // Enum with default value
      location: z.string().optional(), // Optional
      img: z.string().optional(), // Optional
      isDeleted: z.boolean().default(false), // Optional with default value
    }),
  }),
});

export const updateUserValidationSchema = z.object({
  body: z.object({
    user: z.object({
      fullName: z.string().min(1, 'Full name must be at least 3 characters').optional(),
      contactNo: z
        .string()
        .min(10, 'Contact number must be at least 10 digits')
        .max(15, 'Contact number cannot exceed 15 digits')
        .optional(),
      email: z.string().email('Invalid email format').optional(),
      myBalance: z.object({
        deposit: z.number().default(0),
        refund: z.number().default(0)
      }).optional(),
      location: z.string().min(3, 'Location must be at least 3 characters').optional(),
      dob: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
        .optional(),
      img: z.string().optional(),
      otpVerified: z.boolean().default(false).optional(),
      status: z.enum(['active', 'blocked']).default('active').optional(),
      skills: z.array(z.string()).default([]).optional(),
      adminClientEmail: z.string().optional(),
      isDeleted: z.boolean().default(false).optional(),
    }).optional(),
  }),
});
export const checkUserDataValidationSchema = z.object({
  body: z.object({
    user: z.object({
      phone: z
        .string()
        .min(10, 'Contact number must be at least 10 digits')
        .max(15, 'Contact number cannot exceed 15 digits')
    })
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  checkUserDataValidationSchema
};
