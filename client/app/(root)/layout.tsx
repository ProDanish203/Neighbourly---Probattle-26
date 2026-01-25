'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/app-sidebar';
import { AppHeader } from '@/components/shared/app-header';
import { EmailVerificationAlert } from '@/components/shared/email-verification-alert';
import { useAuthStore } from '@/store/auth.store';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuthStore();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
          {user && !user.isEmailVerified && <EmailVerificationAlert email={user.email} />}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
