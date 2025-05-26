import { z } from 'zod';

export const createNotificationValidationSchema = z.object({
  body: z.object({
    Notification: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      atcCodes: z.string().min(1),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateNotificationValidationSchema = z.object({
  body: z.object({
    Notification: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      atcCodes: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
