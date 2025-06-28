import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const timeSlotRegex = /^([01]\d|2[0-3]):00-([01]\d|2[0-3]):00$/;

export const createMyScheduleValidationSchema = z.object({
  body: z.object({
    contractorId: z.string().regex(objectIdRegex, 'Invalid ObjectId'),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    timeSlots: z.array(z.string().regex(timeSlotRegex, 'Invalid time slot format. Use HH:00-HH:00 (24-hour)')).min(1),
  }),
});


export const updateMyScheduleValidationSchema = z.object({
  body: z.object({
    contractorId: z.string().regex(objectIdRegex, 'Invalid ObjectId').optional(),
    day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
    timeSlots: z.array(z.string().regex(timeSlotRegex, 'Invalid time slot format. Use HH:00-HH:00 (24-hour)')).min(1).optional(),
    isDeleted: z.boolean().optional(),
  }),
});

