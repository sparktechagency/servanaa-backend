import { z } from 'zod';

export const createCardValidationSchema = z.object({
  body: z.object({
    card: z.object({
      userId: z.string(),
      paymentMethodId: z.string(),
      cardBrand: z.string(),
      last4: z.string(),
      expMonth: z.number(),
      expYear: z.number(),
    }),
  }),
});

export const updateCardValidationSchema = z.object({
  body: z.object({
    card: z.object({
      userId: z.string().optional(),
     paymentMethodId: z.string().optional(),
      cardBrand: z.string().optional(),
      last4: z.string().optional(),
      expMonth: z.number().optional(),
      expYear: z.number().optional(),
    }),
  }),
});
