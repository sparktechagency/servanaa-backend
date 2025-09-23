export const SUBSCRIPTION_SEARCHABLE_FIELDS = [
  'planType',
  'status',
  'stripeCustomerId'
];

export const SUBSCRIPTION_STATUS = [
  'active',
  'inactive',
  'cancelled',
  'expired',
  'failed'
] as const;

export const PLAN_TYPES = ['gold', 'platinum', 'diamond'] as const;

export const PLAN_TYPE = {
  basic: 'basic',
  premium: 'premium'
} as const;

export type PlanType = typeof PLAN_TYPE[keyof typeof PLAN_TYPE];

export const SUBSCRIPTION_FILTERABLE_FIELDS = [
  'planType',
  'status',
  'contractorId',
  'searchTerm'
];
