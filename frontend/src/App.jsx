import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import SsoVerifiedScreen from '@/components/SsoVerifiedScreen';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import SsoNexus from '@/pages/SsoNexus';
import Logout from '@/pages/Logout';

import AppLayout from '@/components/layout/AppLayout';
import ExecutiveDashboard from '@/pages/ExecutiveDashboard';
import ReturnAnalytics from '@/pages/ReturnAnalytics';
import SlaMonitoring from '@/pages/SlaMonitoring';
import GeographicAnalytics from '@/pages/GeographicAnalytics';
import CourierPerformance from '@/pages/CourierPerformance';
import Shipments from '@/pages/Shipments';
import Reports from '@/pages/Reports';
import Integrations from '@/pages/Integrations';
import WebhookLogs from '@/pages/WebhookLogs';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const {
    user,
    isLoadingAuth,
    isLoadingPublicSettings,
    isLoggingOut,
    isSsoVerifying,
    authError,
    navigateToLogin,
  } = useAuth();

  if (isLoggingOut) {
    return <SsoVerifiedScreen user={user} mode="logout" />;
  }

  if (isSsoVerifying) {
    return <SsoVerifiedScreen user={user} mode="login" />;
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ExecutiveDashboard />} />
          <Route path="/returns" element={<ReturnAnalytics />} />
          <Route path="/sla" element={<SlaMonitoring />} />
          <Route path="/geographic" element={<GeographicAnalytics />} />
          <Route path="/couriers" element={<CourierPerformance />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/webhook-logs" element={<WebhookLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/sso/nexus" element={<SsoNexus />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App