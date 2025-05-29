import { z } from 'zod';

export const createFaqValidationSchema = z.object({
  body: z.object({
    question: z.string().min(1),
    answer: z.string().min(1).optional(),
    }),
});

export const updateFaqValidationSchema = z.object({
  body: z.object({
      answer: z.string().optional(),
      question: z.string().optional(),
    }),
});
