import { z } from "zod";

export const statusSchema = z.object({
  body: z.object({
  status: z.enum(["active", "blocked"]),
 }),
})

export const addOrUpdateCardSchema = z.object({
  body: z.object({
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cardHolderName: z.string().optional(),
    paymentMethodId: z.string().optional(),
    cvc: z.string().optional(),
  })
});
