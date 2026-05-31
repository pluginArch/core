import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  const topNavItems = [
    { id: 'home', label: 'Home', active: true },
    { id: 'plugins', label: 'Plugins' },
  ];

  const services = [
    { id: 'control', label: 'Control Plane' },
    { id: 'catalog', label: 'Plugin Catalog' },
  ];

  const accountActions = [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];

  it('renders shell frame and content', () => {
    render(
      <AppShell
        brand="PluginArch"
        topNavItems={topNavItems}
        services={services}
        accountActions={accountActions}
        userDisplayName="Dhixson"
      >
        <h1>Hello</h1>
      </AppShell>,
    );

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('fires service and account callbacks when selecting menu items', () => {
    const onServiceSelect = vi.fn();
    const onAccountActionSelect = vi.fn();

    render(
      <AppShell
        brand="PluginArch"
        topNavItems={topNavItems}
        services={services}
        accountActions={accountActions}
        userDisplayName="Dhixson"
        onServiceSelect={onServiceSelect}
        onAccountActionSelect={onAccountActionSelect}
      >
        <div>Body</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Control Plane/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Plugin Catalog/i }));

    fireEvent.click(screen.getByRole('button', { name: /Dhixson/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Profile/i }));

    expect(onServiceSelect).toHaveBeenCalledWith({
      id: 'catalog',
      label: 'Plugin Catalog',
    });
    expect(onAccountActionSelect).toHaveBeenCalledWith({
      id: 'profile',
      label: 'Profile',
    });
  });

  it('fires top navigation callback', () => {
    const onTopNavSelect = vi.fn();

    render(
      <AppShell
        brand="PluginArch"
        topNavItems={topNavItems}
        services={services}
        accountActions={accountActions}
        userDisplayName="Dhixson"
        onTopNavSelect={onTopNavSelect}
      >
        <div>Body</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Plugins/i }));

    expect(onTopNavSelect).toHaveBeenCalledWith({
      id: 'plugins',
      label: 'Plugins',
    });
  });
});
