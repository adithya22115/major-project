import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Layout
import Layout from './components/common/Layout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Donor pages
import DonorDashboard from './pages/donor/DonorDashboard';
import DonateMedicine from './pages/donor/DonateMedicine';
import DonationHistory from './pages/donor/DonationHistory';

// Recipient pages
import RecipientDashboard from './pages/recipient/RecipientDashboard';
import MedicinePool from './pages/recipient/MedicinePool';
import MedicineDetails from './pages/recipient/MedicineDetails';
import MyRequests from './pages/recipient/MyRequests';

// Pharmacy pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PendingDonations from './pages/pharmacy/PendingDonations';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import PharmacyRequests from './pages/pharmacy/PharmacyRequests';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Shared pages
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading MediCycle...</p>
        </div>
      </div>
    );
  }

  // Helper to get dashboard path by role
  const getDashboardPath = (role) => {
    switch (role) {
      case 'DONOR': return '/donor/dashboard';
      case 'RECIPIENT': return '/recipient/dashboard';
      case 'PHARMACY': return '/pharmacy/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/';
    }
  };

  if (!user) {
    return (
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Default redirect based on role */}
          <Route path="/" element={<Navigate to={getDashboardPath(user.role)} replace />} />

          {/* Authenticated Routes wrapped in Layout */}
          <Route element={<Layout />}>
            {/* Donor Routes */}
            {user.role === 'DONOR' && (
              <>
                <Route path="/donor/dashboard" element={<DonorDashboard />} />
                <Route path="/donor/donate" element={<DonateMedicine />} />
                <Route path="/donor/donations" element={<DonationHistory />} />
              </>
            )}

            {/* Recipient Routes */}
            {user.role === 'RECIPIENT' && (
              <>
                <Route path="/recipient/dashboard" element={<RecipientDashboard />} />
                <Route path="/recipient/medicines" element={<MedicinePool />} />
                <Route path="/recipient/medicines/:id" element={<MedicineDetails />} />
                <Route path="/recipient/requests" element={<MyRequests />} />
              </>
            )}

            {/* Pharmacy Routes */}
            {user.role === 'PHARMACY' && (
              <>
                <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                <Route path="/pharmacy/pending" element={<PendingDonations />} />
                <Route path="/pharmacy/inventory" element={<InventoryManagement />} />
                <Route path="/pharmacy/requests" element={<PharmacyRequests />} />
                <Route path="/pharmacy/reports" element={<Reports />} />
              </>
            )}

            {/* Admin Routes */}
            {user.role === 'ADMIN' && (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<Settings />} />
              </>
            )}

            {/* Shared Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Catch-all for authenticated users */}
            <Route path="*" element={<Navigate to={getDashboardPath(user.role)} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;