export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'bookingRequest',
  BOOKING_ACCEPTED: 'bookingAccepted',
  BOOKING_REJECTED: 'bookingRejected',
  WORK_COMPLETED: 'workCompleted',
  PAYMENT_TRANSFERRED: 'paymentTransferred',

  // Payment system notifications
  PAYMENT_RECEIVED: 'paymentReceived',
  PAYMENT_FAILED: 'paymentFailed',
  REFUND_PROCESSED: 'refundProcessed',
  SESSION_STARTED: 'sessionStarted',
  SESSION_COMPLETED: 'sessionCompleted',
  WITHDRAWAL_REQUESTED: 'withdrawalRequested',
  WITHDRAWAL_COMPLETED: 'withdrawalCompleted',
  WITHDRAWAL_FAILED: 'withdrawalFailed',
  BANK_ACCOUNT_VERIFIED: 'bankAccountVerified',
  PAYMENT_DISPUTED: 'paymentDisputed' // Add this missing type
} as const;

export const TypeValues = Object.values(NOTIFICATION_TYPES);
export const NOTIFICATION_SEARCHABLE_FIELDS = ['message', 'title'];
