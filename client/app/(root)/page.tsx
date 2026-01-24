'use client';

import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/lib/enums';
import { ProviderServicesPage } from './_components/provider-services-page';
import { SeekerServicesPage } from './_components/seeker-services-page';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container px-4 py-8">
      {user.role === UserRole.PROVIDER ? <ProviderServicesPage /> : <SeekerServicesPage />}
    </main>
  );
}
