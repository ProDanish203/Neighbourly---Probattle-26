'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { verifyOtpSchema, type VerifyOtpSchema } from '@/schema/auth.schema';
import { verifyOtp, resendOtp } from '@/API/auth.api';
import { useOtpStore } from '@/store/otp.store';
import { OtpType, OtpChannel } from '@/lib/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyOtpPage() {
  const router = useRouter();
  const { email, otpType, otpChannel, setResetToken } = useOtpStore();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: email || '',
      type: otpType || undefined,
      otpChannel: otpChannel,
      otp: '',
    },
  });

  useEffect(() => {
    if (email) setValue('email', email);
    if (otpType) setValue('type', otpType);
    setValue('otpChannel', otpChannel);
  }, [email, otpType, otpChannel, setValue]);

  useEffect(() => {
    if (!email || !otpType) {
      router.push('/forgot-password');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, otpType, router]);

  const { mutateAsync: verifyOtpMutate, isPending } = useMutation({
    mutationFn: verifyOtp,
  });

  const { mutateAsync: resendOtpMutate, isPending: isResending } = useMutation({
    mutationFn: resendOtp,
  });

  const onSubmit = async (data: { email: string; type: OtpType; otpChannel: OtpChannel; otp: string }) => {
    const { success, response } = await verifyOtpMutate(data);
    if (!success) return toast.error(typeof response === 'string' ? response : 'Failed to verify OTP');

    if ('token' in response && response.token) {
      setResetToken(response.token);
      toast.success('OTP verified successfully');
      router.push('/reset-password');
    } else {
      toast.success('OTP verified successfully');

      // Check if this is email verification and redirect back to original page
      if (otpType === OtpType.EMAIL_VERIFICATION) {
        const redirectPath = typeof window !== 'undefined' ? sessionStorage.getItem('emailVerificationRedirect') : null;
        if (redirectPath) {
          sessionStorage.removeItem('emailVerificationRedirect');
          router.push(redirectPath);
          return;
        } else {
          router.push('/profile');
          return;
        }
      }

      router.push('/login');
    }
  };

  const handleResend = async () => {
    if (!email || !otpType) return;

    const { success, response } = await resendOtpMutate({
      email,
      type: otpType,
      otpChannel,
    });
    if (!success) return toast.error(typeof response === 'string' ? response : 'Failed to resend OTP');

    toast.success('OTP resent successfully');
    setTimer(60);
    setCanResend(false);
  };

  if (!email || !otpType) {
    return null;
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
          <CardDescription>Enter the verification code sent to {email}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                {...register('otp')}
                aria-invalid={errors.otp ? 'true' : 'false'}
              />
              {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {canResend ? (
                  'You can resend the code now'
                ) : (
                  <>
                    Resend code in <span className="font-medium">{timer}s</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isResending}
                className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Resending...' : 'Resend'}
              </button>
            </div>
          </CardContent>

          <CardFooter className="mt-4 flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
