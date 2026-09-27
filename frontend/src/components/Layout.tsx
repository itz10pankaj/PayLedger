import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { profileService } from '../features/profile/services/profile.service';
import { gatewayService } from '../features/gateway/services/gateway.service';
import {
  IconUser,
  IconHome,
  IconWallet,
  IconSwap,
  IconPieChart,
  IconHelp,
  IconShield,
  IconSearch,
  IconBell,
  IconChevronDown,
  IconInbox,
} from './icons';
import styles from './Layout.module.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: IconHome },
  { to: '/payment-requests', label: 'Requests', icon: IconInbox },
  { to: '/accounts', label: 'Accounts', icon: IconWallet },
  { to: '/transactions', label: 'Transactions', icon: IconSwap },
  { to: '/expenses', label: 'Expenses', icon: IconPieChart },
  { to: '/help', label: 'Help', icon: IconHelp },
];

function UserMenu({ onLogout }: { onLogout: () => void }) {
  const [name, setName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    profileService
      .getMe()
      .then((p) => setName(p.name))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initial = name ? name.charAt(0).toUpperCase() : '•';

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button type="button" className={styles.userMenuTrigger} onClick={() => setOpen((v) => !v)}>
        <span className={styles.avatar}>{initial}</span>
        <span className={styles.userName}>{name ?? '…'}</span>
        <IconChevronDown width={16} height={16} />
      </button>
      {open && (
        <div className={styles.userMenuDropdown}>
          <Link to="/profile" className={styles.userMenuItem} onClick={() => setOpen(false)}>
            <IconUser width={16} height={16} />
            Profile
          </Link>
          <button
            type="button"
            className={styles.userMenuItem}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    function refresh() {
      gatewayService
        .listPendingPaymentRequests()
        .then((requests) => setPendingRequestCount(requests.length))
        .catch(() => {});
    }
    refresh();
    // Requests expire in 15 minutes and someone else's app can approve/
    // decline one from outside this tab entirely, so a short poll (plus
    // a refetch whenever the route changes) keeps the badge honest
    // without needing a push channel for something this low-stakes.
    const interval = setInterval(refresh, 20_000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  return (
    <div className={styles.shell}>
      {user && (
        <aside className={styles.sidebar}>
          <Link to="/dashboard" className={styles.brand}>
            <span className={styles.brandMark} />
            PayLedger
          </Link>
          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <link.icon width={18} height={18} />
                {link.label}
                {link.to === '/payment-requests' && pendingRequestCount > 0 && (
                  <span className={styles.navBadge}>{pendingRequestCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <IconShield width={16} height={16} />
            <div>
              <div className={styles.sidebarFooterTitle}>Secure &amp; Encrypted</div>
              <div className={styles.sidebarFooterSub}>Your data is safe with us</div>
            </div>
          </div>
        </aside>
      )}
      <div className={styles.main}>
        {user && (
          <header className={styles.topbar}>
            <div className={styles.searchBox}>
              <IconSearch width={16} height={16} />
              <input type="text" placeholder="Search transactions, accounts, or anything…" disabled />
            </div>
            <div className={styles.topbarRight}>
              <button type="button" className={styles.iconBtn} aria-label="Notifications" disabled>
                <IconBell width={18} height={18} />
              </button>
              <UserMenu onLogout={logout} />
            </div>
          </header>
        )}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
