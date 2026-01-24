import { z } from 'zod';
import { UserRole, OtpType, OtpChannel } from '@/lib/enums';
import { userSchema, type UserSchema } from './user.schema';

export const loginSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' }),
  rememberMe: z.boolean().optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Password must contain at least one symbol' }),
  role: z.nativeEnum(UserRole, { message: 'User role is required' }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: 'Password must contain at least one symbol' }),
  resetToken: z.string().min(1, { message: 'Reset token is required' }),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export const sendOtpSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
  type: z.nativeEnum(OtpType, { message: 'OTP type is required' }),
  otpChannel: z.nativeEnum(OtpChannel).default(OtpChannel.EMAIL),
});

export type SendOtpSchema = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = sendOtpSchema.extend({
  otp: z.string().min(1, { message: 'OTP is required' }),
});

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;

export const loginUserResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type LoginUserResponseSchema = z.infer<typeof loginUserResponseSchema>;

export const registerUserResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
});

export type RegisterUserResponseSchema = z.infer<typeof registerUserResponseSchema>;

export const otpVerificationResponseSchema = z.object({
  token: z.string().optional(),
});

export type OtpVerificationResponseSchema = z.infer<typeof otpVerificationResponseSchema>;
