import { z } from 'zod';

export const FrequencySchema = z.object({
  type: z.enum(["Just Once", "Weekly"]),
  days: z.union([
    // if "Just Once" then a string YYYY-MM-DD
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    // if "Weekly" then array of allowed days
    z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
  ]),
}).refine((data) => {
  if (data.type === "Just Once") {
    return typeof data.days === "string";
  }
  if (data.type === "Weekly") {
    return Array.isArray(data.days);
  }
  return false;
}, {
  message: "Invalid frequency.days for the given frequency.type",
});


export const createBookingValidationSchema = z.object({
  body: z.object({
    booking: z.object({
    clientId: z.string().length(24), // assuming MongoDB ObjectId hex string
  providerId: z.string().length(24),
  frequency: FrequencySchema,
  duration: z.number().min(1),
  paymentStatus: z.string().default("pending"),
  price: z.number().default(0),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isDeleted: z.boolean().optional(),
      }),
    }),
  })
export const FrequencySchemaUpdate = z.object({
  type: z.enum(["Just Once", "Weekly"]).optional(),
  days: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
  ]).optional(),
}).refine((data) => {
  if (data.type === "Just Once") {
    return typeof data.days === "string";
  }
  if (data.type === "Weekly") {
    return Array.isArray(data.days);
  }
  return false;
}, {
  message: "Invalid frequency.days for the given frequency.type",
}).optional();

export const updateBookingValidationSchema = z.object({
  body: z.object({
    booking: z.object({
      clientId: z.string().length(24).optional(),
      providerId: z.string().length(24).optional(),
      frequency: FrequencySchemaUpdate,
      duration: z.number().min(1).optional(),
      paymentIntent: z.string().min(1).optional(),
      paymentStatus: z.string().default("pending").optional(),
      price: z.number().default(0).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      isDeleted: z.boolean().optional(),
      status: z.enum(["pending", "ongoing", "completed", "cancelled"]).optional(),
      date: z.string().optional(),
    }).partial().optional(), // all fields optional, booking object itself optional
  }),
});

