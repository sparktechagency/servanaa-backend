import { z } from 'zod';

export const createCustomerValidationSchema = z.object({
  body: z.object({
    Customer: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      atcCodes: z.string().min(1),
      isDeleted: z.boolean().default(false)
    })
  })
});

export const updateCustomerValidationSchema = z.object({
  body: z.object({
    Customer: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      atcCodes: z.string().optional(),
      isDeleted: z.boolean().optional()
    })
  })
});
