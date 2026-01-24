import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  LoginUserResponseSchema,
  RegisterUserResponseSchema,
  OtpVerificationResponseSchema,
} from '@/schema/auth.schema';
import api from './middleware';
import { AxiosError } from 'axios';

export const register = async (payload: RegisterSchema) => {
  try {
    const { data } = await api.post('/auth/register', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as RegisterUserResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Registration failed',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const login = async (payload: LoginSchema) => {
  try {
    const { data } = await api.post('/auth/login', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as LoginUserResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Login failed',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const logout = async () => {
  try {
    const { data } = await api.post('/auth/logout', {}, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'Logout successful',
      };
    }
    return {
      success: false,
      response: data?.message || 'Logout failed',
    };
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const forgotPassword = async (payload: ForgotPasswordSchema) => {
  try {
    const { data } = await api.post('/auth/forgot-password', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'Password reset email sent successfully',
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to send password reset email',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const resetPassword = async (payload: ResetPasswordSchema) => {
  try {
    const { data } = await api.post('/auth/reset-password', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'Password reset successfully',
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to reset password',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const verifyEmail = async () => {
  try {
    const { data } = await api.put('/auth/verify-email', {}, { withCredentials: true });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'Email verification email sent successfully',
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to send email verification',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const sendOtp = async (payload: SendOtpSchema) => {
  try {
    const { data } = await api.post('/auth/send-otp', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'OTP sent successfully',
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to send OTP',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const resendOtp = async (payload: SendOtpSchema) => {
  try {
    const { data } = await api.post('/auth/resend-otp', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.message || 'OTP resent successfully',
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to resend OTP',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};

export const verifyOtp = async (payload: VerifyOtpSchema) => {
  try {
    const { data } = await api.post('/auth/verify-otp', payload, {
      withCredentials: true,
    });
    if (data?.success) {
      return {
        success: true,
        response: data.data as OtpVerificationResponseSchema,
      };
    } else {
      return {
        success: false,
        response: data?.message || 'Failed to verify OTP',
      };
    }
  } catch (error: AxiosError | unknown) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        response: error.response?.data?.message || 'An unknown error occurred',
      };
    }
    return { success: false, response: 'An unknown error occurred' };
  }
};
