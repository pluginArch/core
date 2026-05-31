import { fireEvent, render, screen } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('renders the landing shell content', () => {
    render(<App />);

    expect(screen.getByText('PluginArch')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Build once. Launch everywhere.' }),
    ).toBeTruthy();
    expect(screen.getByText('Current service: Core UI')).toBeTruthy();
    expect(screen.getByText('Selected section: Overview')).toBeTruthy();
  });

  it('updates selected service from the services menu', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /core ui/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Integrations' }));

    expect(screen.getByText('Current service: Integrations')).toBeTruthy();
    expect(screen.getByText('Activity: Switched to Integrations')).toBeTruthy();
  });
});
