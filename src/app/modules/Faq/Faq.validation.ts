import { z } from 'zod';

export const createFaqValidationSchema = z.object({
  body: z.object({
    faq: z.object({
      answer: z.string().min(1),
      question: z.string().optional(),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateFaqValidationSchema = z.object({
  body: z.object({
    faq: z.object({
      answer: z.string().optional(),
      question: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
