import { useMemo, useState } from 'react';
import {
  AppShell,
  type AccountAction,
  type FooterLink,
  type ServiceItem,
  type TopNavItem,
} from '@pluginarch/core-ui';

const TOP_NAV_ITEMS: TopNavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'docs', label: 'Docs' },
  { id: 'roadmap', label: 'Roadmap' },
];

const SERVICES: ServiceItem[] = [
  { id: 'core-ui', label: 'Core UI' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'workflows', label: 'Workflows' },
];

const ACCOUNT_ACTIONS: AccountAction[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'sign-out', label: 'Sign out', danger: true },
];

const FOOTER_LINKS: FooterLink[] = [
  { id: 'status', label: 'Status', href: '#' },
  { id: 'security', label: 'Security', href: '#' },
  { id: 'support', label: 'Support', href: '#' },
];

export function App() {
  const [activeTopNavId, setActiveTopNavId] = useState('overview');
  const [activeServiceId, setActiveServiceId] = useState('core-ui');
  const [lastAction, setLastAction] = useState('Ready');

  const topNavItems = useMemo(
    () =>
      TOP_NAV_ITEMS.map((item) => ({
        ...item,
        active: item.id === activeTopNavId,
      })),
    [activeTopNavId],
  );

  const activeServiceLabel = useMemo(
    () =>
      SERVICES.find((service) => service.id === activeServiceId)?.label ??
      'Unknown',
    [activeServiceId],
  );

  return (
    <AppShell
      brand="PluginArch"
      topNavItems={topNavItems}
      services={SERVICES}
      accountActions={ACCOUNT_ACTIONS}
      userDisplayName="Drew H"
      activeServiceId={activeServiceId}
      footerText="PluginArch platform demo"
      footerLinks={FOOTER_LINKS}
      onTopNavSelect={(item) => {
        setActiveTopNavId(item.id);
        setLastAction(`Navigated to ${item.label}`);
      }}
      onServiceSelect={(service) => {
        setActiveServiceId(service.id);
        setLastAction(`Switched to ${service.label}`);
      }}
      onAccountActionSelect={(action) => {
        setLastAction(`Account action: ${action.label}`);
      }}
    >
      <h1>Build once. Launch everywhere.</h1>
      <p>Current service: {activeServiceLabel}</p>
      <p>Selected section: {topNavItems.find((item) => item.active)?.label}</p>
      <p>Activity: {lastAction}</p>
    </AppShell>
  );
}

export default App;
