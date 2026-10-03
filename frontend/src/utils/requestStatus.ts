export const REQUEST_STATUSES = [
  'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'ACTIVE',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
