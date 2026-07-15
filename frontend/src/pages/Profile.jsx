import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, MapPin, Phone, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Profile</h1>
        <p className="text-muted mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-10 text-white text-center sm:text-left sm:flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mx-auto sm:mx-0 backdrop-blur-sm shadow-inner">
            <span className="text-4xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="mt-4 sm:mt-0">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 opacity-90 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full font-medium">{user?.role}</span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Account Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 border-b border-theme pb-2">
                Contact Information
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Email Address</p>
                    <p className="text-sm text-muted">{user?.email}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Phone Number</p>
                    <p className="text-sm text-muted">+1 (555) 123-4567</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 border-b border-theme pb-2">
                Location
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">Address</p>
                    <p className="text-sm text-muted">123 Health Ave<br />Medical District<br />City, ST 12345</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-theme flex justify-end">
            <button className="px-4 py-2 border border-theme rounded-lg text-sm font-medium text-muted hover:bg-surface2 hover:text-primary transition-colors">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
