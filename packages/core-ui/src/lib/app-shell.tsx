import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AccountAction,
  AppShellProps,
  ServiceItem,
  TopNavItem,
} from './types';
import './core-ui.css';

interface MenuState {
  servicesOpen: boolean;
  accountOpen: boolean;
}

function useMenuState() {
  const [menuState, setMenuState] = useState<MenuState>({
    servicesOpen: false,
    accountOpen: false,
  });

  const closeAll = () =>
    setMenuState({ servicesOpen: false, accountOpen: false });

  return {
    menuState,
    closeAll,
    openServices: () =>
      setMenuState({ servicesOpen: true, accountOpen: false }),
    openAccount: () => setMenuState({ servicesOpen: false, accountOpen: true }),
  };
}

function pickActiveService(services: ServiceItem[], activeServiceId?: string) {
  return (
    services.find((service) => service.id === activeServiceId) ??
    services[0] ??
    null
  );
}

export function AppShell({
  brand,
  topNavItems,
  services,
  accountActions,
  userDisplayName,
  activeServiceId,
  footerText,
  footerLinks,
  children,
  onTopNavSelect,
  onServiceSelect,
  onAccountActionSelect,
}: AppShellProps) {
  const { menuState, closeAll, openServices, openAccount } = useMenuState();
  const servicesWrapRef = useRef<HTMLDivElement | null>(null);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);

  const activeService = useMemo(
    () => pickActiveService(services, activeServiceId),
    [services, activeServiceId],
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const node = event.target as Node;
      if (
        servicesWrapRef.current?.contains(node) ||
        accountWrapRef.current?.contains(node)
      ) {
        return;
      }
      closeAll();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAll();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [closeAll]);

  const handleTopNavSelect = (item: TopNavItem) => {
    onTopNavSelect?.(item);
    closeAll();
  };

  const handleServiceSelect = (service: ServiceItem) => {
    onServiceSelect?.(service);
    closeAll();
  };

  const handleAccountActionSelect = (action: AccountAction) => {
    onAccountActionSelect?.(action);
    closeAll();
  };

  return (
    <div className="coreUiShell">
      <header className="coreUiHeader" role="banner">
        <div className="coreUiHeaderLeft">
          <div className="coreUiBrand">{brand}</div>
          <div className="coreUiMenuWrap" ref={servicesWrapRef}>
            <button
              type="button"
              className="coreUiTriggerButton"
              aria-haspopup="menu"
              aria-expanded={menuState.servicesOpen}
              onClick={() =>
                menuState.servicesOpen ? closeAll() : openServices()
              }
            >
              <span>{activeService?.label ?? 'Select Service'}</span>
              <span className="coreUiChevron">▾</span>
            </button>
            {menuState.servicesOpen ? (
              <div
                className="coreUiMenu"
                role="menu"
                aria-label="Service Switcher"
              >
                <div className="coreUiMenuTitle">Services</div>
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className="coreUiActionButton"
                    role="menuitem"
                    onClick={() => handleServiceSelect(service)}
                  >
                    {service.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <nav className="coreUiTopNav" aria-label="Global Navigation">
            {topNavItems.map((item) =>
              item.href ? (
                <a
                  key={item.id}
                  href={item.href}
                  className={`coreUiNavButton coreUiTopNavLink ${item.active ? 'coreUiNavButtonActive' : ''}`}
                  onClick={() => handleTopNavSelect(item)}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  className={`coreUiNavButton ${item.active ? 'coreUiNavButtonActive' : ''}`}
                  onClick={() => handleTopNavSelect(item)}
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>
        </div>

        <div className="coreUiHeaderRight">
          <div className="coreUiMenuWrap" ref={accountWrapRef}>
            <button
              type="button"
              className="coreUiTriggerButton"
              aria-haspopup="menu"
              aria-expanded={menuState.accountOpen}
              onClick={() =>
                menuState.accountOpen ? closeAll() : openAccount()
              }
            >
              <span>{userDisplayName}</span>
              <span className="coreUiChevron">▾</span>
            </button>
            {menuState.accountOpen ? (
              <div className="coreUiMenu" role="menu" aria-label="Account Menu">
                <div className="coreUiMenuTitle">Account</div>
                {accountActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={`coreUiActionButton ${action.danger ? 'coreUiActionDanger' : ''}`}
                    role="menuitem"
                    onClick={() => handleAccountActionSelect(action)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="coreUiMain" role="main">
        <section className="coreUiContent">{children}</section>
      </main>

      <footer className="coreUiFooter" role="contentinfo">
        <span>{footerText ?? 'Copyright © 2026. All rights reserved.'}</span>
        {footerLinks?.length ? (
          <div className="coreUiFooterLinks">
            {footerLinks.map((link) => (
              <a key={link.id} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </footer>
    </div>
  );
}
