// import { z } from 'zod';

// export const FrequencySchema = z.object({
//   type: z.enum(["Just Once", "Weekly"]),
//   days: z.union([
//     // if "Just Once" then a string YYYY-MM-DD
//     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
//     // if "Weekly" then array of allowed days
//     z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
//   ]),
// }).refine((data) => {
//   if (data.type === "Just Once") {
//     return typeof data.days === "string";
//   }
//   if (data.type === "Weekly") {
//     return Array.isArray(data.days);
//   }
//   return false;
// }, {
//   message: "Invalid frequency.days for the given frequency.type",
// });


// export const createBookingValidationSchema = z.object({
//   body: z.object({
//     booking: z.object({
//     clientId: z.string().length(24), // assuming MongoDB ObjectId hex string
//   providerId: z.string().length(24),
//   frequency: FrequencySchema,
//   duration: z.number().min(1),
//   paymentStatus: z.string().default("pending"),
//   price: z.number().default(0),
//   startTime: z.string().regex(/^\d{2}:\d{2}$/),
//   endTime: z.string().regex(/^\d{2}:\d{2}$/),
//   isDeleted: z.boolean().optional(),
//       }),
//     }),
//   })
// export const FrequencySchemaUpdate = z.object({
//   type: z.enum(["Just Once", "Weekly"]).optional(),
//   days: z.union([
//     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
//     z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
//   ]).optional(),
// }).refine((data) => {
//   if (data.type === "Just Once") {
//     return typeof data.days === "string";
//   }
//   if (data.type === "Weekly") {
//     return Array.isArray(data.days);
//   }
//   return false;
// }, {
//   message: "Invalid frequency.days for the given frequency.type",
// }).optional();

// export const updateBookingValidationSchema = z.object({
//   body: z.object({
//     booking: z.object({
//       clientId: z.string().length(24).optional(),
//       providerId: z.string().length(24).optional(),
//       frequency: FrequencySchemaUpdate,
//       duration: z.number().min(1).optional(),
//       paymentIntent: z.string().min(1).optional(),
//       paymentStatus: z.string().default("pending").optional(),
//       price: z.number().default(0).optional(),
//       startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
//       endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
//       isDeleted: z.boolean().optional(),
//       status: z.enum(["pending", "ongoing", "completed", "cancelled"]).optional(),
//       date: z.string().optional(),
//     }).partial().optional(), // all fields optional, booking object itself optional
//   }),
// });

////////////
import { z } from "zod";

// Common day validation for bookingType.days depending on type
const bookingTypeSchema = z.object({
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
});


// Create Booking Schema
export const createBookingValidationSchema = z.object({
  customerId: z.string().length(24, "Invalid ObjectId"),
  contractorId: z.string().length(24, "Invalid ObjectId"),
  categoryId: z.string().length(24, "Invalid ObjectId"),
  subCategoryId: z.string().length(24, "Invalid ObjectId"),
  materialId: z.string().length(24, "Invalid ObjectId"),
  bookingType: bookingTypeSchema,
  duration: z.number().min(1, "Duration must be at least 1 hour"),
  price: z.number().min(0),
  paymentIntent: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid startTime format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid endTime format (HH:mm)"),
});

// Update Booking Schema - all fields optional except maybe the id
export const updateBookingValidationSchema = createBookingValidationSchema.partial().extend({
  id: z.string().length(24, "Invalid ObjectId").optional(),
});
