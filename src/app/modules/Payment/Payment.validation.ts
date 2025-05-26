import { z } from 'zod';

export const createPaymentValidationSchema = z.object({
  body: z.object({
    Payment: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      atcCodes: z.string().min(1),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updatePaymentValidationSchema = z.object({
  body: z.object({
    Payment: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      atcCodes: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
