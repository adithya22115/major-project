import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, History, User,
  Package, ClipboardList, Clock, BarChart3, Users,
  Pill, ShieldCheck, Settings, LogOut, FileCheck, BadgeCheck, Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ mobile = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const getNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'DONOR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard',      path: '/donor/dashboard' },
          { icon: PlusCircle,      label: 'Donate Medicine', path: '/donor/donate' },
          { icon: History,         label: 'My Donations',    path: '/donor/donations' },
        ];
      case 'RECIPIENT':
        return [
          { icon: LayoutDashboard, label: 'Dashboard',    path: '/recipient/dashboard' },
          { icon: Package,         label: 'Medicine Pool', path: '/recipient/medicines' },
          { icon: ClipboardList,   label: 'My Requests',  path: '/recipient/requests' },
        ];
      case 'PHARMACY':
        return [
          { icon: FileCheck,       label: 'Verification',     path: '/pharmacy/verification' },
          ...(user.verified ? [
            { icon: LayoutDashboard, label: 'Dashboard',         path: '/pharmacy/dashboard' },
            { icon: Clock,           label: 'Pending Donations',  path: '/pharmacy/pending' },
            { icon: Package,         label: 'Inventory',         path: '/pharmacy/inventory' },
            { icon: ClipboardList,   label: 'Requests',          path: '/pharmacy/requests' },
            { icon: BarChart3,       label: 'Reports',           path: '/pharmacy/reports' },
          ] : []),
          { icon: User,            label: 'Profile',           path: '/profile' },
        ];
      case 'ADMIN':
        return [
          { icon: LayoutDashboard, label: 'Dashboard',    path: '/admin/dashboard' },
          { icon: Users,           label: 'Users',        path: '/admin/users' },
          { icon: Pill,            label: 'Medicines',    path: '/admin/medicines' },
          { icon: ShieldCheck,     label: 'Verifications', path: '/admin/verifications' },
          { icon: BarChart3,       label: 'Reports',      path: '/admin/reports' },
          { icon: Settings,        label: 'Settings',     path: '/admin/settings' },
        ];
      case 'DOCTOR':
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/doctor/dashboard' },
          { icon: User,            label: 'Profile',   path: '/profile' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const isGuest = user?.isGuest;

  return (
    <div className={`${mobile ? 'flex' : 'hidden md:flex'} w-64 max-w-[85vw] bg-surface border-r border-theme h-screen flex-col fixed left-0 top-0 z-40 transition-colors duration-200`}>

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-theme shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-600/30">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">MediCycle</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-0.5 px-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'text-muted hover:bg-surface2 hover:text-primary'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* User info + Actions */}
      <div className="p-3 border-t border-theme space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface2/50">
          <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-primary truncate">{user?.name}</p>
              {user?.verified && user?.role === 'PHARMACY' && (
                <BadgeCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted capitalize">
              {user?.role?.toLowerCase()}
              {isGuest && ' (Guest)'}
            </p>
          </div>
        </div>
        {isGuest ? (
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
          >
            <Home className="h-5 w-5 shrink-0" />
            Back to Home
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
