import { z } from 'zod';

export const createCategoryValidationSchema = z.object({
  body: z.object({ 
    category: z.object({
      name: z.string().min(1),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateCategoryValidationSchema = z.object({
  body: z.object({
    category: z.object({
      name: z.string().optional(),
      img: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }).optional(),
  }),
});
