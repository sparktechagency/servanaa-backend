import { z } from 'zod';

// export const createContractorValidationSchema = z.object({
//   body: z.object({
//     Contractor: z.object({
//       name: z.string().min(1),
//       description: z.string().optional(),
//       atcCodes: z.string().min(1),
//       isDeleted: z.boolean().default(false),
//     }),
//   }),
// });

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
