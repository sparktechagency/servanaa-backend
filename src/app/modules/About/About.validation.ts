import { z } from 'zod';

export const createAboutValidationSchema = z.object({
  body: z.object({
      description: z.string().optional(),
  }),
});

export const updateAboutValidationSchema = z.object({
  body: z.object({
      description: z.string().optional(),
      isDeleted: z.boolean().optional(),
  }),
});
