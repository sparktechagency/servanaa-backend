import { z } from "zod";

export const bookingValidationSchema = z.object({
  body: z.object({
       customerId: z.string(),
  contractorId: z.string(),
  categoryId: z.string(),
  subCategoryId: z.string(),
  materialId: z.string(),
  bookingType: z.object({
    type: z.enum(["Just Once", "Weekly"]),
    days: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
      z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    ]),
  }).superRefine((data, ctx) => {
    if (data.type === "Just Once") {
      if (typeof data.days !== "string") {
        ctx.addIssue({
          path: ["days"],
          message: "For 'Just Once', days must be a date string (YYYY-MM-DD)",
          code: z.ZodIssueCode.custom,
        });
      }
    } else if (data.type === "Weekly") {
      if (!Array.isArray(data.days)) {
        ctx.addIssue({
          path: ["days"],
          message: "For 'Weekly', days must be an array of weekdays",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  }),
  duration: z.number().min(1, "Duration must be at least 1 hour"),
  price: z.number().min(0),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
    }),
  })



export const updateBookingValidationSchema = z.object({
  body: z.object({
  customerId: z.string().optional(),
  contractorId: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  materialId: z.string().optional(),
  bookingType: z.object({
    type: z.enum(["Just Once", "Weekly"]),
    days: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
      z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    ]),
  }).superRefine((data, ctx) => {
    if (data.type === "Just Once") {
      if (typeof data.days !== "string") {
        ctx.addIssue({
          path: ["days"],
          message: "For 'Just Once', days must be a date string (YYYY-MM-DD)",
          code: z.ZodIssueCode.custom,
        });
      }
    } else if (data.type === "Weekly") {
      if (!Array.isArray(data.days)) {
        ctx.addIssue({
          path: ["days"],
          message: "For 'Weekly', days must be an array of weekdays",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  }).optional(),
  duration: z.number().min(1, "Duration must be at least 1 hour").optional(),
  price: z.number().min(0).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
    }),
  })