import { z } from 'zod';

export const createMaterialValidationSchema = z.object({
  body: z.object({
      name: z.string().min(1),
      unit: z.number(),
      price: z.number().min(1),
    }),
});

export const updateMaterialValidationSchema = z.object({
  body: z.object({
      name: z.string().min(1).optional(),
      unit: z.number().optional(),
      price: z.number().min(1).optional(),
    }),
});
