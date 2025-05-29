import { z } from 'zod';

export const createSubCategoryValidationSchema = z.object({
  body: z.object({
      name: z.string().min(1),
      categoryId: z.string().min(1),
    }),
});

export const updateSubCategoryValidationSchema = z.object({
  body: z.object({
      name: z.string().optional(),
      img: z.string().optional(),
      categoryId: z.string().optional(),
    }),
});
