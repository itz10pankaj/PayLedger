import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import styles from './Layout.module.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/expenses', label: 'Expenses' },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className={`container ${styles.header}`}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.brand}>
            PayLedger
          </Link>
          {user && (
            <nav className={styles.nav}>
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        {user && (
          <button type="button" className="btn" onClick={logout}>
            Log out
          </button>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
