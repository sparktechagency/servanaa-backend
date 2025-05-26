import { z } from 'zod';

export const createPrivacyValidationSchema = z.object({
  body: z.object({
    privacy: z.object({
      description: z.string().optional(),
    }),
  }),
});

export const updatePrivacyValidationSchema = z.object({
  body: z.object({
    privacy: z.object({
      description: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
