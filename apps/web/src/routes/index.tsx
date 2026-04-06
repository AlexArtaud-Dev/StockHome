import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/Auth/Login';
import { RegisterPage } from '../pages/Auth/Register';
import { HomePage } from '../pages/Home/Home';
import { RoomPage } from '../pages/Room/Room';
import { ContainerPage } from '../pages/Container/Container';
import { ScanPage } from '../pages/Scan/Scan';
import { SearchPage } from '../pages/Search/Search';
import { ShoppingListPage } from '../pages/ShoppingList/ShoppingList';
import { SettingsPage } from '../pages/Settings/Settings';
import { BulkAddPage } from '../pages/BulkAdd/BulkAdd';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          color: 'var(--color-text-muted)',
        }}
      >
        Loading…
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route
        path="/auth/login"
        element={
          <RedirectIfAuth>
            <LoginPage />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/auth/register"
        element={
          <RedirectIfAuth>
            <RegisterPage />
          </RedirectIfAuth>
        }
      />

      {/* Protected */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route
        path="/rooms/:id"
        element={
          <RequireAuth>
            <RoomPage />
          </RequireAuth>
        }
      />
      <Route
        path="/containers/:id"
        element={
          <RequireAuth>
            <ContainerPage />
          </RequireAuth>
        }
      />
      <Route
        path="/containers/:containerId/bulk-add"
        element={
          <RequireAuth>
            <BulkAddPage />
          </RequireAuth>
        }
      />
      <Route
        path="/scan"
        element={
          <RequireAuth>
            <ScanPage />
          </RequireAuth>
        }
      />
      <Route
        path="/search"
        element={
          <RequireAuth>
            <SearchPage />
          </RequireAuth>
        }
      />
      <Route
        path="/shopping-list"
        element={
          <RequireAuth>
            <ShoppingListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
