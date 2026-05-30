import { ReactNode } from 'react';

export interface TopNavItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
}

export interface ServiceItem {
  id: string;
  label: string;
  description?: string;
}

export interface AccountAction {
  id: string;
  label: string;
  danger?: boolean;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface AppShellProps {
  brand: string;
  topNavItems: TopNavItem[];
  services: ServiceItem[];
  accountActions: AccountAction[];
  userDisplayName: string;
  activeServiceId?: string;
  footerText?: string;
  footerLinks?: FooterLink[];
  children: ReactNode;
  onTopNavSelect?: (item: TopNavItem) => void;
  onServiceSelect?: (service: ServiceItem) => void;
  onAccountActionSelect?: (action: AccountAction) => void;
}
