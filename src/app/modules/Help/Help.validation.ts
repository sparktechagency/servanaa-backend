import { z } from 'zod';

export const createHelpValidationSchema = z.object({
  body: z.object({
      // userId: z.string().min(1),
      clientMessage: z.string(),
      adminMessage: z.string().optional(),
      isDeleted: z.boolean().default(false),
    }),
  })


export const updateHelpValidationSchema = z.object({
  body: z.object({
      userId: z.string().optional(),
      clientMessage: z.string().optional(),
      adminMessage: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  })

