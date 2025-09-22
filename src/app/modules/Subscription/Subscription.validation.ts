import { z } from 'zod';

export const createSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Plan name is required'),
    type: z.enum(['gold', 'platinum', 'diamond']),
    duration: z.number().min(1, 'Duration must be at least 1 month'),
    price: z.number().min(0, 'Price must be positive'),
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    isActive: z.boolean().default(true)
  })
});

export const updateSubscriptionPlanSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['gold', 'platinum', 'diamond']).optional(),
    duration: z.number().min(1).optional(),
    price: z.number().min(0).optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional()
  })
});

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planType: z.enum(['gold', 'platinum', 'diamond'])
  })
});

export const changeSubscriptionPlanSchema = z.object({
  body: z.object({
    planType: z.enum(['gold', 'platinum', 'diamond']),
    prorate: z.boolean().default(true)
  })
});

export const revenueAnalyticsSchema = z.object({
  query: z
    .object({
      startDate: z
        .string()
        .optional()
        .refine(date => {
          if (!date) return true;
          return !isNaN(Date.parse(date));
        }, 'Invalid start date format'),
      endDate: z
        .string()
        .optional()
        .refine(date => {
          if (!date) return true;
          return !isNaN(Date.parse(date));
        }, 'Invalid end date format')
    })
    .optional()
});
