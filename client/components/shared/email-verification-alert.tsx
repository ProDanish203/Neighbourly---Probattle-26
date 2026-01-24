'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { verifyEmail, sendOtp } from '@/API/auth.api';
import { useOtpStore } from '@/store/otp.store';
import { OtpType, OtpChannel } from '@/lib/enums';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationAlertProps {
  email: string;
  onVerified?: () => void;
}

export function EmailVerificationAlert({ email, onVerified }: EmailVerificationAlertProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOtpData } = useOtpStore();

  const { mutateAsync: verifyEmailMutate, isPending: isSending } = useMutation({
    mutationFn: verifyEmail,
  });

  const handleVerifyEmail = async () => {
    const { success, response } = await verifyEmailMutate();
    if (!success) {
      toast.error(typeof response === 'string' ? response : 'Failed to send verification email');
      return;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('emailVerificationRedirect', pathname);
    }

    setOtpData(email, OtpType.EMAIL_VERIFICATION, OtpChannel.EMAIL);
    toast.success('Verification email sent. Please check your inbox.');
    router.push('/verify-otp');
  };

  return (
    <Alert
      variant="default"
      className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400"
    >
      <Mail className="h-4 w-4" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Email Verification Required</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4 text-amber-800 dark:text-amber-200">
        <span>Please verify your email address to access all features.</span>
        <Button size="sm" onClick={handleVerifyEmail} disabled={isSending} className="shrink-0">
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
