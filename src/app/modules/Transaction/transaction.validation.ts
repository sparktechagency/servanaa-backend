import { z } from 'zod';

export const createTransactionValidationSchema = z.object({
  body: z.object({
      amount: z.number().min(1),
      type: z
        .enum(['gold', 'platinum', 'Diamond']),
    }),
  })

export const updateTransactionValidationSchema = z.object({
  body: z.object({
    amount: z.number().min(1).optional(),
      type: z
        .enum(['gold', 'platinum', 'Diamond']).optional(),
  }),
});
export const processValidationSchema = z.object({
  body: z.object({
    transaction: z.object({
      competitionId: z.string().nonempty().optional(),
    }).optional(),
  }),
});





export const studentValidations = {
  createTransactionValidationSchema,
  updateTransactionValidationSchema,
};


