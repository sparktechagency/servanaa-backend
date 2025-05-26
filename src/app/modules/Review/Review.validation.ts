import { z } from 'zod';

export const createReviewValidationSchema = z.object({
  body: z.object({
    review: z.object({
      userName: z.string().min(1),
      userImg: z.string().min(1),
      clientId: z.string().min(1),
      providerId: z.string().min(1),
      description: z.string().optional(),
      star: z.number().min(1),
      improveText: z.array(z.string()).min(1).optional(),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateReviewValidationSchema = z.object({
  body: z.object({
    review: z.object({
      name: z.string().min(1).optional(),
      clientId: z.string().min(1).optional(),
      description: z.string().optional(),
      star: z.number().min(1).optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
