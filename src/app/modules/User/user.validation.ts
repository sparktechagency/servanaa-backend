import { z } from 'zod';

export const statusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'blocked'])
  })
});
