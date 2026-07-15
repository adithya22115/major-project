import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, ClipboardList, Pill, Clock } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-surface rounded-xl shadow-sm border border-theme p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted mb-1">{label}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const ActivityRow = ({ icon: Icon, colorClass, title, subtitle }) => (
  <div className="p-4 bg-surface rounded-xl border border-theme">
    <div className="flex items-start space-x-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-0.5">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="mt-1 text-muted">Here's an overview of your activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Donations Made"
          value="12"
          icon={Heart}
          colorClass="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
        />
        <StatCard
          label="Requests Made"
          value="3"
          icon={ClipboardList}
          colorClass="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
        />
        <StatCard
          label="Medicines Donated"
          value="45"
          icon={Pill}
          colorClass="bg-purple-500/10 text-purple-400 dark:bg-purple-500/20"
        />
        <StatCard
          label="Last Activity"
          value="Today"
          icon={Clock}
          colorClass="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
        />
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold text-primary mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityRow
            icon={Heart}
            colorClass="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
            title="Donation submitted"
            subtitle="2 hours ago · Aspirin 100mg × 30 tablets"
          />
          <ActivityRow
            icon={ClipboardList}
            colorClass="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
            title="Request approved"
            subtitle="5 hours ago · Paracetamol 500mg × 20 tablets"
          />
          <ActivityRow
            icon={Clock}
            colorClass="bg-surface2 text-muted"
            title="Profile updated"
            subtitle="1 day ago · Added phone number"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;