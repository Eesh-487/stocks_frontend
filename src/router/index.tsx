import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PortfolioPage from '../pages/PortfolioPage';
import RiskPage from '../pages/RiskPage';
import PerformancePage from '../pages/PerformancePage';
import EnhancedOptimizationPage from '../pages/EnhancedOptimizationPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import { ROUTES } from '../constants/routes';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return children;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      
      <Route 
        path={ROUTES.HOME} 
        element={
          <ProtectedRoute>
            <Navigate to={ROUTES.DASHBOARD} replace />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
        <Route path={ROUTES.RISK} element={<RiskPage />} />
        <Route path={ROUTES.PERFORMANCE} element={<PerformancePage />} />
        <Route path={ROUTES.OPTIMIZATION} element={<EnhancedOptimizationPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};

export default AppRouter;