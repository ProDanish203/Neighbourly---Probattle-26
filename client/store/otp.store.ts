import { OtpType, OtpChannel } from '@/lib/enums';
import { create } from 'zustand';

interface OtpState {
  email: string | null;
  otpType: OtpType | null;
  otpChannel: OtpChannel;
  resetToken: string | null;
  setOtpData: (email: string, otpType: OtpType, otpChannel?: OtpChannel) => void;
  setResetToken: (token: string) => void;
  clearOtpData: () => void;
}

export const useOtpStore = create<OtpState>((set) => ({
  email: null,
  otpType: null,
  otpChannel: OtpChannel.EMAIL,
  resetToken: null,
  setOtpData: (email, otpType, otpChannel = OtpChannel.EMAIL) => set({ email, otpType, otpChannel }),
  setResetToken: (token) => set({ resetToken: token }),
  clearOtpData: () => set({ email: null, otpType: null, resetToken: null, otpChannel: OtpChannel.EMAIL }),
}));
