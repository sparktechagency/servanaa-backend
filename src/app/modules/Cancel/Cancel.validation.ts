import { z } from 'zod';

export const createCancelValidationSchema = z.object({
  body: z.object({
      charge: z.number().min(1),
      description: z.string().optional(),
      message: z.string().min(1),
      isDeleted: z.boolean().default(false),
    }),
  })


export const updateCancelValidationSchema = z.object({
  body: z.object({
      charge: z.number().optional(),
      description: z.string().optional(),
      message: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  })

