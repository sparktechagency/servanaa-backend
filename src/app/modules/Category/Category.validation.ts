import { z } from 'zod';

export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1)
  })
});

export const updateCategoryValidationSchema = z.object({
  body: z
    .object({
      name: z.string().optional(),
      img: z.string().optional()
    })
    .optional()
});
