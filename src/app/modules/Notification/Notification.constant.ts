export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'bookingRequest',
  BOOKING_ACCEPTED: 'bookingAccepted',
  BOOKING_REJECTED: 'bookingRejected',
  WORK_COMPLETED: 'workCompleted',
  PAYMENT_TRANSFERRED: 'paymentTransferred'
} as const;

export const TypeValues = Object.values(NOTIFICATION_TYPES);
export const NOTIFICATION_SEARCHABLE_FIELDS = ['message', 'title'];
