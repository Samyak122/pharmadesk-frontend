import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { BillingPage } from './pages/BillingPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Loader } from './components/common/Loader';

function ProtectedLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100/70">
      <Sidebar />
      <main className="flex-1 p-6">
        <Navbar />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Authenticating" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Loading app" />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><DashboardPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><ProtectedLayout><BillingPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/medicines" element={<ProtectedRoute><ProtectedLayout><MedicinesPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><ProtectedLayout><InventoryPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/inventory/stock-alerts" element={<ProtectedRoute><ProtectedLayout><InventoryPage defaultFilter="stock" /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/inventory/expiry-alerts" element={<ProtectedRoute><ProtectedLayout><InventoryPage defaultFilter="expiry" /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute><ProtectedLayout><PurchasesPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><ProtectedLayout><SuppliersPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><ProtectedLayout><CustomersPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ProtectedLayout><ReportsPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><SettingsPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
