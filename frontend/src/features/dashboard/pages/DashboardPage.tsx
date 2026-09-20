import { useAuth } from '../../auth/context/AuthContext';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className={`container ${styles.wrapper}`}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.email}.</p>
    </div>
  );
}
