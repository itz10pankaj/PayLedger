import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/user/pages/SignupPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';

// New feature areas (payments, accounts, ledger, ...) get their own
// <Route> here, pointing at that feature's own pages/ folder.
export function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages own the full viewport (AuthLayout) — no shared header. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
