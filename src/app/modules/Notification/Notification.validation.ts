import { z } from 'zod';

export const createNotificationValidationSchema = z.object({
  body: z.object({
      userId: z.string().min(1),
      title: z.string().min(1),
      message: z.string(),
    }),
  })

export const updateNotificationValidationSchema = z.object({
  body: z.object({
      userId: z.string().optional(),
      title: z.string().optional(),
      message: z.string().optional(),
      isRead: z.array(z.string()).min(1).optional(),
    }),
  })
