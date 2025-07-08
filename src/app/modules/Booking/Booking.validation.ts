import { z } from "zod";

export const bookingValidationSchema = z.object({
  body: z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"), // Customer ObjectId
  contractorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"), // Contractor ObjectId
  // categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"), // Category ObjectId
  subCategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"), // SubCategory ObjectId
  // rateHourly: z.number().min(0, "Price must be non-negative"), // rateHourly
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  periodInDays: z.number().min(1, "Period in days must be at least 1").optional(),
  material: z.array(
    z.object({
      name: z.string(),
      unit: z.string(),
      price: z.number().min(0, "Price must be non-negative"),
    })
  ),
  bookingType: z.enum(["OneTime", "Weekly"]),
  duration: z.number(),
  // price: z.number().min(0, "Price must be non-negative"),
  // Updated days validation: supports both a date string or a single weekday name
day: z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format YYYY-MM-DD" }), // OneTime
  z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]), // Weekly - one day
  z.array(z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])) // Weekly - multiple days
]),
   startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid timeSlot format (HH:mm)"),
    }),
  })



export const updateBookingValidationSchema = z.object({
  body: z.object({
  customerId: z.string().optional(),
  contractorId: z.string().optional(),
  // categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  materialId: z.string().optional(),
  bookingType: z.object({
    type: z.enum(["OneTime", "Weekly"]),
    days: z.union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
      z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    ]),
  }).superRefine((data, ctx) => {
    if (data.type === "OneTime") {
      if (typeof data.days !== "string") {
        ctx.addIssue({
          path: ["days"],
          message: "For 'OneTime', days must be a date string (YYYY-MM-DD)",
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