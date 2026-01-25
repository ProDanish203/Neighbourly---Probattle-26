'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterSchema } from '@/schema/auth.schema';
import { register as registerUser } from '@/API/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const { mutateAsync: registerMutate, isPending } = useMutation({
    mutationFn: registerUser,
  });

  const onSubmit = async (data: RegisterSchema) => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    const { success, response } = await registerMutate({ ...data, role: selectedRole });
    if (!success) return toast.error(typeof response === 'string' ? response : 'Registration failed');

    if ('user' in response && 'token' in response) {
      const { user, token } = response;
      setUser(user);
      setToken(token);
      toast.success('Registration successful');
      router.push('/profile');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setValue('role', role, { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Select Your Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect(UserRole.SEEKER)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                    selectedRole === UserRole.SEEKER
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-background',
                  )}
                >
                  <User
                    className={cn(
                      'h-8 w-8 mb-2',
                      selectedRole === UserRole.SEEKER ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      selectedRole === UserRole.SEEKER ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    Seeker
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect(UserRole.PROVIDER)}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                    selectedRole === UserRole.PROVIDER
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 bg-background',
                  )}
                >
                  <Briefcase
                    className={cn(
                      'h-8 w-8 mb-2',
                      selectedRole === UserRole.PROVIDER ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      selectedRole === UserRole.PROVIDER ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    Provider
                  </span>
                </button>
              </div>
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
          </CardContent>

          <CardFooter className="mt-4 flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isPending || !selectedRole}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
