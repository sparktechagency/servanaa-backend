import { z } from 'zod';

export const createReportValidationSchema = z.object({
  body: z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid bookingId ObjectId'),
  subjectCategory: z.string().min(1, 'Subject category is required'),
  feedback: z.object({
    customerText: z.string().min(1, 'Customer text is required'),
    adminText: z.string().optional().default('').optional(),
  }),
  }),
});

export const updateReportValidationSchema = z.object({
  body: z.object({
  bookingId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid bookingId ObjectId').optional(),
  subjectCategory: z.string().min(1, 'Subject category is required').optional(),
  feedback: z.object({
    customerText: z.string().min(1, 'Customer text is required').optional(),
    adminText: z.string().optional().default('').optional(),
  }).optional(),
    }),
  })
