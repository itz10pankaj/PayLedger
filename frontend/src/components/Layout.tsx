import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import styles from './Layout.module.css';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className={`container ${styles.header}`}>
        <Link to="/" className={styles.brand}>
          PayLedger
        </Link>
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
