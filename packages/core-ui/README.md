# @pluginarch/core-ui

Shared UI shell library for plugin applications.

## What It Provides

- AWS-console-inspired shell layout with clear separation between global/service navigation and account actions.
- Header with top navigation and service switcher menu.
- Right-side account menu rendered by the library.
- Footer with configurable text and optional links.
- Default design tokens via CSS variables that host apps can override.

## Usage

```tsx
import {
  AppShell,
  type AccountAction,
  type ServiceItem,
  type TopNavItem,
} from '@pluginarch/core-ui';

const topNavItems: TopNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', active: true },
  { id: 'plugins', label: 'Plugins' },
  { id: 'observability', label: 'Observability' },
];

const services: ServiceItem[] = [
  { id: 'control', label: 'Control Plane' },
  { id: 'catalog', label: 'Plugin Catalog' },
  { id: 'events', label: 'Event Hub' },
];

const accountActions: AccountAction[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'settings', label: 'Settings' },
  { id: 'signout', label: 'Sign out', danger: true },
];

export function App() {
  return (
    <AppShell
      brand="PluginArch"
      topNavItems={topNavItems}
      services={services}
      accountActions={accountActions}
      userDisplayName="Dhixson"
      footerText="Copyright © 2026 PluginArch"
      onTopNavSelect={(item) => console.log('top nav', item)}
      onServiceSelect={(service) => console.log('service', service)}
      onAccountActionSelect={(action) => console.log('account action', action)}
    >
      <h1>Plugin Home</h1>
      <p>
        Use this shell to keep a consistent look and feel across plugin apps.
      </p>
    </AppShell>
  );
}
```

## Theme Overrides

Override CSS variables in the host app to brand plugin experiences:

```css
:root {
  --core-ui-header-bg: #0a1526;
  --core-ui-accent: #0f8f6f;
  --core-ui-font-family: 'Sora', 'Segoe UI', sans-serif;
}
```

## Development Tasks

- Build: `npm exec nx -- build core-ui`
- Test: `npm exec nx -- test core-ui`
- Typecheck: `npm exec nx -- typecheck core-ui`
- Publish through Nx: `NODE_AUTH_TOKEN="$(gh auth token)" npm exec nx -- release publish -p core-ui --registry=https://npm.pkg.github.com`
- Affected checks from workspace root: `npm exec nx -- affected -t build,test,typecheck --outputStyle=static`
