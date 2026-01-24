'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPasswordSchema, type ResetPasswordSchema } from '@/schema/auth.schema';
import { z } from 'zod';
import { resetPassword } from '@/API/auth.api';
import { useOtpStore } from '@/store/otp.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { resetToken, clearOtpData } = useOtpStore();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const formSchema = resetPasswordSchema.omit({ resetToken: true });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!resetToken) router.push('/login');
  }, [resetToken, router]);

  const { mutateAsync: resetPasswordMutate, isPending } = useMutation({
    mutationFn: resetPassword,
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!resetToken) {
      toast.error('Invalid reset token. Please request a new password reset.');
      router.push('/forgot-password');
      return;
    }

    if (data.newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordError('');
    const { success, response } = await resetPasswordMutate({
      ...data,
      resetToken,
    });
    if (!success) return toast.error(typeof response === 'string' ? response : 'Failed to reset password');

    clearOtpData();
    toast.success('Password reset successfully');
    router.push('/login');
  };

  if (!resetToken) return null;

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter your new password"
                {...register('newPassword')}
                aria-invalid={errors.newPassword ? 'true' : 'false'}
              />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value !== newPassword) {
                    setPasswordError('Passwords do not match');
                  } else {
                    setPasswordError('');
                  }
                }}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
          </CardContent>

          <CardFooter className="mt-4 flex flex-col items-stretch space-y-4">
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isPending}
              style={{ pointerEvents: isPending ? 'none' : 'auto' }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
            <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
