import { z } from 'zod';

export const createTransactionValidationSchema = z.object({
  body: z.object({
    transaction: z.object({
      competitionId: z.string().nonempty(),
      paymentStatus: z
        .enum(['pending', 'completed', 'failed'])
        .default('pending'),
        type: z
        .enum(['entry_fee', 'withdrawal'])
        .default('entry_fee'),
        adminPermission: z
        .enum(['pending', 'approved', 'rejected'])
        .default('pending'),
      isDeleted: z.boolean().default(false),
    }),
  }),
});
export const updateTransactionValidationSchema = z.object({
  body: z.object({
    transaction: z.object({
      competitionId: z.string().nonempty().optional(),
      amount: z.string().nonempty({ message: 'Amount must be a positive number.' }).optional(),
      paymentStatus: z
        .enum(['pending', 'completed', 'failed'])
        .default('pending').optional(),
        type: z
        .enum(['entry_fee', 'withdrawal'])
        .default('entry_fee').optional(),
        adminPermission: z
        .enum(['pending', 'approved', 'rejected'])
        .default('pending').optional(),
      isDeleted: z.boolean().default(false).optional(),
    }).optional(),
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


