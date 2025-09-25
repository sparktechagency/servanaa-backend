import { z } from 'zod';

// Main booking validation schema

// src/app/modules/Booking/Booking.validation.ts

// Material schema
const materialSchema = z.object({
  name: z.string().min(1, 'Material name is required'),
  unit: z.string().min(1, 'Material unit is required'),
  price: z.number().positive('Material price must be positive')
});

// Question schema
const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required')
});

// Fix: Make validation more flexible to match actual usage
export const createBookingValidationSchema = z.object({
  body: z.object({
    // These might be set by the service layer, so make them optional
    customerId: z.string().min(1, 'Customer ID is required').optional(),
    contractorId: z.string().min(1, 'Contractor ID is required'),
    subCategoryId: z.string().min(1, 'Sub category ID is required'),

    bookingType: z.enum(['oneTime', 'weekly'], {
      errorMap: () => ({
        message: "Booking type must be 'oneTime' or 'weekly'"
      })
    }),

    // Make these optional since they might be calculated
    questions: z
      .array(questionSchema)
      .min(1, 'At least one question is required')
      .optional(),
    material: z
      .array(materialSchema)
      .min(1, 'At least one material is required')
      .optional(),

    // Duration is required for calculations
    duration: z.number().positive('Duration must be positive'),
    startTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid start time format (HH:MM)'
      ),

    // Day can be string or array depending on booking type
    day: z
      .union([
        z.string().min(1, 'Day is required'),
        z.array(z.string()).min(1, 'At least one day is required')
      ])
      .optional(),

    // Booking date for oneTime bookings
    bookingDate: z
      .union([
        z.string().datetime(),
        z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      ])
      .optional(),

    // These are calculated fields, make them optional
    timeSlots: z.array(z.string()).optional(),
    price: z.number().positive('Price must be positive').optional(),
    endTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        'Invalid end time format (HH:MM)'
      )
      .optional(),
    rateHourly: z.number().positive().optional(),

    // Weekly booking specific
    periodInDays: z.number().positive('Period must be positive').optional(),

    // Optional fields
    files: z.array(z.any()).optional(),
    clientId: z.string().optional(),
    isDeleted: z.boolean().default(false).optional()
  })
});

// Update booking validation schema
export const updateBookingValidationSchema = z.object({
  body: z.object({
    customerId: z.string().optional(),
    contractorId: z.string().optional(),
    subCategoryId: z.string().optional(),

    bookingType: z.enum(['oneTime', 'weekly']).optional(),

    questions: z.array(questionSchema).optional(),
    material: z.array(materialSchema).optional(),

    timeSlots: z.array(z.string()).optional(),
    duration: z.number().positive().optional(),

    bookingDate: z.string().datetime().optional(),
    price: z.number().positive().optional(),
    day: z.union([z.string(), z.array(z.string())]).optional(),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),

    periodInDays: z.number().positive().optional(),
    isDeleted: z.boolean().optional()
  })
});

// Export validation schemas
export const BookingValidation = {
  createBookingValidationSchema,
  updateBookingValidationSchema
};






