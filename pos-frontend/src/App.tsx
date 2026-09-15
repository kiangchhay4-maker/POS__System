import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/auth.store';

// Pages
import LoginPage from './pages/LoginPage';
import OpenShiftPage from './pages/OpenShiftPage';
import PosPage from './pages/PosPage';
import OrdersPage from './pages/OrdersPage';
import ShiftPage from './pages/ShiftPage';
import SettingsPage from './pages/SettingsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminStaffPage from './pages/AdminStaffPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/open-shift" element={<OpenShiftPage />} />
            
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/pos" replace />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/shift" element={<ShiftPage />} />

              {/* Restricted Admin Routes - Staff cannot hit or access */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route path="/admin/staff" element={<AdminStaffPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Protected route wrapper (logged-in check)
function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

// Admin route wrapper (role check: redirects staff away from admin pages)
function AdminRoute() {
  const { user } = useAuthStore();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
}

export default App;

