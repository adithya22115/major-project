
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
import PharmacyRegisterPage from './pages/pharmacy/PharmacyRegisterPage';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorVerification from './pages/doctor/DoctorVerification';
import DoctorRegisterPage from './pages/doctor/DoctorRegisterPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminVerifications from './pages/admin/AdminVerifications';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">
            Loading MediCycle...
          </p>
        </div>
      </div>
    );
  }

  const getDashboardPath = (role, verified) => {
    switch (role) {
      case 'DONOR':
        return '/donor/dashboard';
      case 'RECIPIENT':
        return '/recipient/dashboard';
      case 'PHARMACY':
        return verified ? '/pharmacy/dashboard' : '/pharmacy/verification';
      case 'ADMIN':
        return '/admin/dashboard';
      case 'DOCTOR':
        return verified ? '/doctor/dashboard' : '/doctor/verification';
      default:
        return '/';
    }
  };

  const isAuthenticated = Boolean(user && !user.isGuest);
  const isDonor = isAuthenticated && user.role === 'DONOR';
  const isRecipient = isAuthenticated && user.role === 'RECIPIENT';
  const isPharmacy = isAuthenticated && user.role === 'PHARMACY';
  const isAdmin = isAuthenticated && user.role === 'ADMIN';
  const isDoctor = isAuthenticated && user.role === 'DOCTOR';

  const pharmacyVerified = isPharmacy && user.verified === true;
  const doctorVerified = isDoctor && user.verified === true;

  const requireRole = (allowed, element) => {
    if (!isAuthenticated) {
      return <Navigate to="/staff-login" replace />;
    }

    if (!allowed.includes(user.role)) {
      return <Navigate to={getDashboardPath(user.role, user.verified)} replace />;
    }

    return element;
  };

  const requireVerifiedPharmacy = (element) => {
    if (!isAuthenticated) {
      return <Navigate to="/staff-login" replace />;
    }

    if (!isPharmacy) {
      return <Navigate to={getDashboardPath(user.role, user.verified)} replace />;
    }

    if (!pharmacyVerified) {
      return <Navigate to="/pharmacy/verification" replace />;
    }

    return element;
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Toaster position="top-right" />

        <Routes>
          {/* Public landing page */}
          <Route
            path="/"
            element={
              isDonor || isRecipient
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <LandingPage />
            }
          />

          {/* Authentication */}
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <LoginPage />
            }
          />

          <Route
            path="/staff-login"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <LoginPage staffOnly />
            }
          />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/register"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <RegisterPage />
            }
          />

          {/* Doctor registration */}
          <Route
            path="/doctor-register"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <DoctorRegisterPage />
            }
          />

          <Route
            path="/doctor/register"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <DoctorRegisterPage />
            }
          />

          {/* Pharmacy registration */}
          <Route
            path="/pharmacy-register"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <PharmacyRegisterPage />
            }
          />

          <Route
            path="/pharmacy/register"
            element={
              isAuthenticated
                ? <Navigate to={getDashboardPath(user.role, user.verified)} replace />
                : <PharmacyRegisterPage />
            }
          />

          {/* Application pages */}
          <Route element={<Layout />}>
            {/* Donor */}
            <Route
              path="/donor/dashboard"
              element={requireRole(['DONOR'], <DonorDashboard />)}
            />

            <Route
              path="/donor/donate"
              element={requireRole(['DONOR'], <DonateMedicine />)}
            />

            <Route
              path="/donor/donations"
              element={requireRole(['DONOR'], <DonationHistory />)}
            />

            {/* Recipient */}
            <Route
              path="/recipient/dashboard"
              element={requireRole(['RECIPIENT'], <RecipientDashboard />)}
            />

            <Route
              path="/recipient/medicines"
              element={requireRole(['RECIPIENT'], <MedicinePool />)}
            />

            <Route
              path="/recipient/medicines/:id"
              element={requireRole(['RECIPIENT'], <MedicineDetails />)}
            />

            <Route
              path="/recipient/requests"
              element={requireRole(['RECIPIENT'], <MyRequests />)}
            />

            {/* Pharmacy verification is accessible to pharmacy accounts
                that have not yet been verified. */}
            <Route
              path="/pharmacy/verification"
              element={
                isPharmacy
                  ? <PharmacyVerification />
                  : <Navigate to="/staff-login" replace />
              }
            />

            {/* Pharmacy dashboard */}
            <Route
              path="/pharmacy/dashboard"
              element={requireVerifiedPharmacy(<PharmacyDashboard />)}
            />

            <Route
              path="/pharmacy/pending"
              element={requireVerifiedPharmacy(<PendingDonations />)}
            />

            <Route
              path="/pharmacy/inventory"
              element={requireVerifiedPharmacy(<InventoryManagement />)}
            />

            <Route
              path="/pharmacy/requests"
              element={requireVerifiedPharmacy(<PharmacyRequests />)}
            />

            <Route
              path="/pharmacy/reports"
              element={requireVerifiedPharmacy(<Reports />)}
            />

            {/* Doctor */}
            <Route
              path="/doctor/verification"
              element={
                isDoctor
                  ? <DoctorVerification />
                  : <Navigate to="/staff-login" replace />
              }
            />

            <Route
              path="/doctor/dashboard"
              element={
                !isDoctor
                  ? <Navigate to="/staff-login" replace />
                  : doctorVerified
                    ? <DoctorDashboard />
                    : <Navigate to="/doctor/verification" replace />
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={requireRole(['ADMIN'], <AdminDashboard />)}
            />

            <Route
              path="/admin/users"
              element={requireRole(['ADMIN'], <UserManagement />)}
            />

            <Route
              path="/admin/medicines"
              element={requireRole(['ADMIN'], <AdminMedicines />)}
            />

            <Route
              path="/admin/verifications"
              element={requireRole(['ADMIN'], <AdminVerifications />)}
            />

            <Route
              path="/admin/reports"
              element={requireRole(['ADMIN'], <Reports />)}
            />

            <Route
              path="/admin/settings"
              element={requireRole(['ADMIN'], <Settings />)}
            />

            {/* Shared authenticated pages */}
            <Route
              path="/profile"
              element={
                isAuthenticated
                  ? <Profile />
                  : <Navigate to="/login" replace />
              }
            />

            <Route
              path="/notifications"
              element={
                isAuthenticated
                  ? <Notifications />
                  : <Navigate to="/login" replace />
              }
            />
          </Route>

          {/* Not found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
