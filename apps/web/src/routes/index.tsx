import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/Auth/Login';
import { RegisterPage } from '../pages/Auth/Register';
import { VerifyEmailPage } from '../pages/Auth/VerifyEmail';
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

      <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/rooms/:id" element={<RequireAuth><RoomPage /></RequireAuth>} />
      <Route path="/containers/:id" element={<RequireAuth><ContainerPage /></RequireAuth>} />
      <Route path="/containers/:containerId/bulk-add" element={<RequireAuth><BulkAddPage /></RequireAuth>} />
      <Route path="/items/:id" element={<RequireAuth><ItemPage /></RequireAuth>} />
      <Route path="/scan" element={<RequireAuth><ScanPage /></RequireAuth>} />
      <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
      <Route path="/shopping-list" element={<RequireAuth><ShoppingListPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
