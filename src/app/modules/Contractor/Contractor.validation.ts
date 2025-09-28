import { z } from 'zod';

export const updateContractorValidationSchema = z.object({
  body: z.object({
    Contractor: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      atcCodes: z.string().optional(),
      isDeleted: z.boolean().optional()
    })
  })
});
