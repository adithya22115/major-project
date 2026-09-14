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
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
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
import PharmacyVerification from './pages/pharmacy/PharmacyVerification';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminVerifications from './pages/admin/AdminVerifications';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import DoctorDashboard from './pages/doctor/DoctorDashboard';

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
  const getDashboardPath = (role, verified) => {
    switch (role) {
      case 'DONOR': return '/donor/dashboard';
      case 'RECIPIENT': return '/recipient/dashboard';
      case 'PHARMACY': return verified ? '/pharmacy/dashboard' : '/pharmacy/verification';
      case 'ADMIN': return '/admin/dashboard';
      case 'DOCTOR': return '/doctor/dashboard';
      default: return '/';
    }
  };

  const isDonor = user?.role === 'DONOR';
  const isRecipient = user?.role === 'RECIPIENT';
  const isPharmacy = user?.role === 'PHARMACY';
  const isAdmin = user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR';

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Landing page always available */}
          <Route path="/" element={
            (isDonor && !user?.isGuest) ? <Navigate to="/donor/dashboard" replace /> :
            (isRecipient && !user?.isGuest) ? <Navigate to="/recipient/dashboard" replace /> :
            <LandingPage />
          } />

          {/* Login only for Admin / Pharmacy */}
          <Route path="/login" element={
            (user && !user?.isGuest) ? <Navigate to={getDashboardPath(user.role, user.verified)} replace /> : <LoginPage />
          } />
          <Route path="/staff-login" element={
            (user && !user?.isGuest) ? <Navigate to={getDashboardPath(user.role, user.verified)} replace /> : <LoginPage staffOnly />
          } />

          {/* Forgot Password */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Reset Password */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Register — public, redirects if already logged in */}
          <Route path="/register" element={
            (user && !user?.isGuest) ? <Navigate to={getDashboardPath(user.role, user.verified)} replace /> : <RegisterPage />
          } />
          <Route path="/doctor-register" element={
            (user && !user?.isGuest) ? <Navigate to={getDashboardPath(user.role, user.verified)} replace /> : <RegisterPage />
          } />


          {/* Authenticated Routes wrapped in Layout */}
          <Route element={<Layout />}>
            {/* Donor Routes (guest or authenticated) */}
            {(isDonor || (!user && false)) && (
              <>
                <Route path="/donor/dashboard" element={<DonorDashboard />} />
                <Route path="/donor/donate" element={<DonateMedicine />} />
                <Route path="/donor/donations" element={<DonationHistory />} />
              </>
            )}

            {/* Recipient Routes (guest or authenticated) */}
            {(isRecipient || (!user && false)) && (
              <>
                <Route path="/recipient/dashboard" element={<RecipientDashboard />} />
                <Route path="/recipient/medicines" element={<MedicinePool />} />
                <Route path="/recipient/medicines/:id" element={<MedicineDetails />} />
                <Route path="/recipient/requests" element={<MyRequests />} />
              </>
            )}

            {/* Pharmacy Routes */}
            {isPharmacy && (
              <>
                <Route path="/pharmacy/verification" element={<PharmacyVerification />} />
                {user.verified && (
                  <>
                    <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                    <Route path="/pharmacy/pending" element={<PendingDonations />} />
                    <Route path="/pharmacy/inventory" element={<InventoryManagement />} />
                    <Route path="/pharmacy/requests" element={<PharmacyRequests />} />
                    <Route path="/pharmacy/reports" element={<Reports />} />
                  </>
                )}
              </>
            )}

            {/* Admin Routes */}
            {isAdmin && (
              <>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/medicines" element={<AdminMedicines />} />
                <Route path="/admin/verifications" element={<AdminVerifications />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<Settings />} />
              </>
            )}
            {isDoctor && <Route path="/doctor/dashboard" element={<DoctorDashboard />} />}

            {/* Shared Routes for authenticated users */}
            {user && (
              <>
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<Notifications />} />
              </>
            )}
            
          </Route>
          {/* Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
