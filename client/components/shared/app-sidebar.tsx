'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { UserProfileDropdown } from './user-profile-dropdown';
import { sidebarNavItems } from '@/lib/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '../ui/button';
import { UserRole } from '@/lib/enums';

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userProfile = {
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    role: user?.role || UserRole.SEEKER,
    profilePicture: undefined,
  };

  const filteredNavItems = sidebarNavItems.filter((item) => item.role?.includes(user?.role as UserRole));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">N</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Neighbourly</span>
            <span className="text-xs text-sidebar-foreground/70">
              {user?.role === UserRole.SEEKER ? 'Seeker Dashboard' : 'Provider Dashboard'}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="group-data-[collapsible=icon]:ml-1"
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3">
        <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center hidden">
          <UserProfileDropdown user={userProfile} showEmail={false} triggerClassName="size-8" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <UserProfileDropdown user={userProfile} showEmail={false} align="end" side="right">
            <Button
              variant="ghost"
              size="icon"
              className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-sidebar-accent transition-colors cursor-pointer text-left"
            >
              {userProfile.profilePicture ? (
                <Image
                  src={userProfile.profilePicture}
                  alt={userProfile.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground shrink-0">
                  {getInitials(userProfile.name)}
                </div>
              )}
              <div className="flex flex-1 flex-col min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{userProfile.role}</p>
              </div>
            </Button>
          </UserProfileDropdown>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
