import { z } from 'zod';

export const createServiceValidationSchema = z.object({
  body: z.object({
    service: z.object({
      requiredTasks: z.string().min(1),
      showSpecialists: z.string().optional(),
      isDeleted: z.boolean().default(false),
    }),
  }),
});

export const updateServiceValidationSchema = z.object({
  body: z.object({
    service: z.object({
      requiredTasks: z.string().optional(),
      showSpecialists: z.string().optional(),
      img: z.string().optional(),
      isDeleted: z.boolean().optional(),
    }),
  }),
});
