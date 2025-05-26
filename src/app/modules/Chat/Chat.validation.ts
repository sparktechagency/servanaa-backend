import { z } from 'zod';

export const createChatValidationSchema = z.object({
  body: z.object({
    Chat: z.object({
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateChatValidationSchema = z.object({
  body: z.object({
    Chat: z.object({
      atcCodes: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
