import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { LoginPage } from '../pages/Auth/Login';
import { RegisterPage } from '../pages/Auth/Register';
import { VerifyEmailPage } from '../pages/Auth/VerifyEmail';
import { NoHouseholdPage } from '../pages/NoHousehold/NoHousehold';
import { HomePage } from '../pages/Home/Home';
import { RoomPage } from '../pages/Room/Room';
import { ContainerPage } from '../pages/Container/Container';
import { ItemPage } from '../pages/Item/Item';
import { ScanPage } from '../pages/Scan/Scan';
import { SearchPage } from '../pages/Search/Search';
import { ShoppingListPage } from '../pages/ShoppingList/ShoppingList';
import { SettingsPage } from '../pages/Settings/Settings';
import { AccountPage } from '../pages/Account/Account';
import { AdminPage } from '../pages/Admin/Admin';
import { BulkAddPage } from '../pages/BulkAdd/BulkAdd';
import { MembersPage } from '../pages/Members/Members';
import { ExpiringPage } from '../pages/Expiring/Expiring';
import { HistoryPage } from '../pages/History/History';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'var(--color-text-muted)' }}>
        Loading…
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
}

function RequireHousehold({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasHousehold, householdsLoaded } = useHousehold();

  if (authLoading || !householdsLoaded) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!hasHousehold) return <Navigate to="/no-household" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/auth/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />

      {/* No household — accessible when authenticated but without a household */}
      <Route path="/no-household" element={<RequireAuth><NoHouseholdPage /></RequireAuth>} />

      {/* Protected — require household */}
      <Route path="/" element={<RequireHousehold><HomePage /></RequireHousehold>} />
      <Route path="/rooms/:id" element={<RequireHousehold><RoomPage /></RequireHousehold>} />
      <Route path="/containers/:id" element={<RequireHousehold><ContainerPage /></RequireHousehold>} />
      <Route path="/containers/:containerId/bulk-add" element={<RequireHousehold><BulkAddPage /></RequireHousehold>} />
      <Route path="/items/:id" element={<RequireHousehold><ItemPage /></RequireHousehold>} />
      <Route path="/scan" element={<RequireHousehold><ScanPage /></RequireHousehold>} />
      <Route path="/search" element={<RequireHousehold><SearchPage /></RequireHousehold>} />
      <Route path="/shopping-list" element={<RequireHousehold><ShoppingListPage /></RequireHousehold>} />
      <Route path="/expiring" element={<RequireHousehold><ExpiringPage /></RequireHousehold>} />
      <Route path="/history" element={<RequireHousehold><HistoryPage /></RequireHousehold>} />
      <Route path="/settings" element={<RequireHousehold><SettingsPage /></RequireHousehold>} />

      {/* Account and admin — require auth only (not household) */}
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="/members" element={<RequireHousehold><MembersPage /></RequireHousehold>} />
      <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
