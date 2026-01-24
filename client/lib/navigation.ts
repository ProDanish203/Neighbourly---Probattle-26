import { Package, Calendar, User, MessageSquare, List } from 'lucide-react';
import { UserRole } from './enums';

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  role?: UserRole[];
}

export const sidebarNavItems: NavItem[] = [
  {
    title: 'Services',
    url: '/',
    icon: Package,
    role: [UserRole.SEEKER, UserRole.PROVIDER],
  },
  {
    title: 'Service Categories',
    url: '/service-categories',
    icon: List,
    role: [UserRole.PROVIDER],
  },
  {
    title: 'Bookings',
    url: '/bookings',
    icon: Calendar,
    role: [UserRole.SEEKER, UserRole.PROVIDER],
  },
  {
    title: 'Chats',
    url: '/chats',
    icon: MessageSquare,
    role: [UserRole.SEEKER, UserRole.PROVIDER],
  },
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
    role: [UserRole.SEEKER, UserRole.PROVIDER],
  },
];
