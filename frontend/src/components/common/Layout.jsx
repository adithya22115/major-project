import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell } from 'lucide-react';

const Layout = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard'))    return 'Dashboard';
    if (path.includes('donate'))       return 'Donate Medicine';
    if (path.includes('donations'))    return 'Donation History';
    if (path.includes('medicines'))    return 'Medicine Pool';
    if (path.includes('requests'))     return 'Requests';
    if (path.includes('pending'))      return 'Pending Donations';
    if (path.includes('inventory'))    return 'Inventory';
    if (path.includes('users'))        return 'User Management';
    if (path.includes('reports'))      return 'Reports';
    if (path.includes('settings'))     return 'Settings';
    if (path.includes('profile'))      return 'Profile';
    if (path.includes('notifications'))return 'Notifications';
    return 'MediCycle';
  };

  const isGuest = user?.isGuest;

  return (
    <div className="min-h-screen bg-page flex transition-colors duration-200">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          },
        }}
      />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">

        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-theme flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-muted hover:bg-surface2 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-primary hidden sm:block">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell (not for guests) */}
            {!isGuest && (
              <Link
                to="/notifications"
                className="p-2 text-muted hover:text-blue-500 hover:bg-surface2 rounded-full transition-colors relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Link>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3 pl-3 border-l border-theme">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-primary">{user?.name || 'User'}</p>
                <p className="text-xs text-muted capitalize">
                  {user?.role?.toLowerCase()}
                  {isGuest && ' (Guest)'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-page">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-surface transform transition-transform shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
