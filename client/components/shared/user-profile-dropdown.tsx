'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, Mail } from 'lucide-react';
import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { logout as logoutAPI } from '@/API/auth.api';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/API/user.api';

interface UserProfileDropdownProps {
  user: {
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
  };
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  className?: string;
  triggerClassName?: string;
  showEmail?: boolean;
  children?: React.ReactNode;
}

export function UserProfileDropdown({
  user,
  align = 'end',
  side = 'bottom',
  sideOffset = 8,
  className,
  triggerClassName,
  showEmail = true,
  children,
}: UserProfileDropdownProps) {
  const router = useRouter();
  const { logout, setUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => getCurrentUser(),
  });

  useEffect(() => {
    if (data?.success) setUser(data.response);
  }, [data]);

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const defaultTrigger = (
    <Button variant="outline" size={'icon'} className={triggerClassName}>
      {user.profilePicture ? (
        <Image src={user.profilePicture} alt={user.name} width={32} height={32} className="rounded-full object-cover" />
      ) : (
        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
          {getInitials(user.name)}
        </div>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children || defaultTrigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} sideOffset={sideOffset} className={cn('w-56', className)}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
          </div>
        </DropdownMenuLabel>
        {showEmail && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 size-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
          <LogOut className="mr-2 size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
