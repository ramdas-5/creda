import { z } from 'zod';
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter email or 12-digit account number'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
export const registerSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  phone: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export const transferSchema = z.object({
  source_account_id: z.string().min(1, 'Select source account'),
  mode: z.enum(['internal', 'beneficiary', 'self']),
  destination_account_id: z.string().optional(),
  beneficiary_id: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive').max(10000000, 'Amount too large'),
  remarks: z.string().max(200).optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;
export const beneficiarySchema = z.object({
  nickname: z.string().min(2),
  full_name: z.string().min(2),
  account_number: z.string().min(4),
  bank_name: z.string().min(2),
  ifsc: z.string().optional(),
});
export const ticketSchema = z.object({
  subject: z.string().min(4),
  category: z.string().min(2),
  message: z.string().min(5),
});
