import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  body: z.object({
      contractorId: z.string().min(1),
      description: z.string().optional(),
      stars: z.number().min(1),
    }),
  })

export const updateReviewValidationSchema = z.object({
  body: z.object({
      customerId: z.string().min(1).optional(),
      contractorId: z.string().min(1).optional(),
      description: z.string().optional(),
      stars: z.number().min(1).optional(),
  }),
});
