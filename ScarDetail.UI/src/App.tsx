import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { ClientLayout } from './components/ClientLayout';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const OwnerSetupPage = lazy(() => import('./pages/auth/OwnerSetupPage').then((m) => ({ default: m.OwnerSetupPage })));
const ClientDashboardPage = lazy(() => import('./pages/client/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage })));
const BookingWizardPage = lazy(() => import('./pages/client/BookingWizardPage').then((m) => ({ default: m.BookingWizardPage })));
const VehiclesPage = lazy(() => import('./pages/client/VehiclesPage').then((m) => ({ default: m.VehiclesPage })));
const AddressesPage = lazy(() => import('./pages/client/AddressesPage').then((m) => ({ default: m.AddressesPage })));
const MyAppointmentsPage = lazy(() => import('./pages/client/MyAppointmentsPage').then((m) => ({ default: m.MyAppointmentsPage })));
const ServicesCatalogPage = lazy(() => import('./pages/client/ServicesCatalogPage').then((m) => ({ default: m.ServicesCatalogPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminAgendaPage = lazy(() => import('./pages/admin/AdminAgendaPage').then((m) => ({ default: m.AdminAgendaPage })));
const AdminNeighborhoodsPage = lazy(() => import('./pages/admin/AdminNeighborhoodsPage').then((m) => ({ default: m.AdminNeighborhoodsPage })));
const AdminServicesPage = lazy(() => import('./pages/admin/AdminServicesPage').then((m) => ({ default: m.AdminServicesPage })));
const AdminWorkingHoursPage = lazy(() => import('./pages/admin/AdminWorkingHoursPage').then((m) => ({ default: m.AdminWorkingHoursPage })));
const AdminBlocksPage = lazy(() => import('./pages/admin/AdminBlocksPage').then((m) => ({ default: m.AdminBlocksPage })));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutos
    },
  },
});

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Carregando ScarDetail...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/book'} replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Raiz / Redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/entrar" element={<AdminLoginPage />} />
            <Route path="/admin/login" element={<Navigate to="/admin/entrar" replace />} />
            <Route path="/admin/configurar" element={<OwnerSetupPage />} />

            {/* Rotas Protegidas de Clientes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={['Client']}>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<ClientDashboardPage />} />
              <Route path="/book" element={<BookingWizardPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/addresses" element={<AddressesPage />} />
              <Route path="/appointments" element={<MyAppointmentsPage />} />
              <Route path="/services" element={<ServicesCatalogPage />} />
            </Route>

            {/* Rotas Administrativas */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="agenda" element={<AdminAgendaPage />} />
              <Route path="neighborhoods" element={<AdminNeighborhoodsPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="hours" element={<AdminWorkingHoursPage />} />
              <Route path="blocks" element={<AdminBlocksPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-sm text-slate-400">Carregando...</p>
  </div>
);

export default App;
