import { z } from 'zod';

export const createFaqValidationSchema = z.object({
  body: z.object({
    question: z.array(z.string()).min(1),
    subCategoryId: z.string().min(1),
    }),
});

export const updateFaqValidationSchema = z.object({
  body: z.object({
      question: z.array(z.string()).min(1).optional(),
      subCategoryId: z.string().min(1).optional(),
    }),
});
