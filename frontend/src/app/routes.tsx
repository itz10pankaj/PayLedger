import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/user/pages/SignupPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { TransactionsPage } from '../features/dashboard/pages/TransactionsPage';
import { ExpensesPage } from '../features/dashboard/pages/ExpensesPage';
import { AccountsPage } from '../features/account/pages/AccountsPage';
import { AccountDetailPage } from '../features/account/pages/AccountDetailPage';
import { SendMoneyPage } from '../features/payment/pages/SendMoneyPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { HelpPage } from '../features/help/pages/HelpPage';

// New feature areas get their own <Route> here, pointing at that
// feature's own pages/ folder.
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
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/send" element={<SendMoneyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
