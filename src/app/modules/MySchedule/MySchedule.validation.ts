import { z } from 'zod';

export const createMyScheduleValidationSchema = z.object({
  body: z.object({
  schedules: z.array(
    z.object({
      day: z.enum([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ]),
      timeSlots: z.array(
        z.string().regex(/^([01]\d|2[0-3]):00-([01]\d|2[0-3]):00$/, {
          message: 'Time slot must be in HH:00-HH:00 24-hour format',
        })
      ).min(1, { message: 'At least one time slot is required' })
    })
  ).min(1, { message: 'At least one schedule is required' }),
  }),

});



// export const updateMyScheduleValidationSchema = z.object({
//   body: z.object({
//   schedules: z.array(ScheduleDaySchema).min(1, {
//     message: 'At least one day is required',
//   }).optional(),
//   isDeleted: z.boolean().optional().default(false),
//   }),
// });

