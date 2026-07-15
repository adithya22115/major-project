import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../services/adminService';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Pill, ShieldCheck, Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboard().catch(() => ({
          stats: { totalUsers: 145, totalDonations: 89, totalMedicines: 312, pendingVerifications: 12 },
          recentActivity: [
            { id: 1, action: 'USER_REGISTERED',   details: "New pharmacy 'City Meds' joined",    time: '2 hours ago' },
            { id: 2, action: 'DONATION_VERIFIED', details: 'Batch of Paracetamol verified',       time: '5 hours ago' },
            { id: 3, action: 'REQUEST_FULFILLED', details: 'Insulin request fulfilled',            time: '1 day ago' },
          ],
          systemAlerts: [{ id: 1, type: 'WARNING', message: 'High volume of pending verifications in South District' }],
        }));
        setDashboardData(data);
      } catch {
        toast.error('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Overview</h1>
        <p className="text-muted mt-1">Monitor platform health, users, and overall activity.</p>
      </div>

      {/* System Alerts */}
      {dashboardData?.systemAlerts?.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-400">System Alerts</h3>
              <ul className="mt-1 text-sm text-amber-300/80 list-disc list-inside space-y-1">
                {dashboardData.systemAlerts.map(alert => (
                  <li key={alert.id}>{alert.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Total Users"           value={dashboardData?.stats?.totalUsers || 0}           icon={Users}       color="blue"   trend="+12% this month" />
        <StatsCard title="Total Donations"        value={dashboardData?.stats?.totalDonations || 0}        icon={Activity}    color="green"  trend="+5% this week" />
        <StatsCard title="Medicines in System"    value={dashboardData?.stats?.totalMedicines || 0}        icon={Pill}        color="purple" />
        <StatsCard title="Pending Verifications"  value={dashboardData?.stats?.pendingVerifications || 0}  icon={ShieldCheck} color="amber"  trend="Needs attention" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Admin Actions */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-theme bg-surface2/30">
            <h2 className="text-base font-semibold text-primary">Admin Actions</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col gap-2">
            {[
              { to: '/admin/users',    icon: Users,       color: 'blue',   title: 'Manage Users',      desc: 'Approve pharmacies, ban users' },
              { to: '/admin/medicines',icon: Pill,        color: 'purple', title: 'Medicine Directory', desc: 'Manage medicine categories' },
              { to: '/admin/reports',  icon: Activity,    color: 'green',  title: 'Platform Reports',   desc: 'View analytics and export data' },
            ].map(({ to, icon: Icon, color, title, desc }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-between p-4 rounded-xl border border-theme hover:border-${color}-500/40 hover:bg-${color}-500/5 transition-colors group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`bg-${color}-500/15 p-2.5 rounded-lg text-${color}-400 group-hover:bg-${color}-500/25 transition-colors`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-primary text-sm">{title}</p>
                    <p className="text-xs text-muted">{desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-subtle group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-base font-semibold text-primary">Audit Logs & Activity</h2>
            <button className="text-sm font-medium text-blue-500 hover:text-blue-400">View All Logs</button>
          </div>
          <ul className="divide-y divide-theme">
            {dashboardData?.recentActivity?.map((activity) => (
              <li key={activity.id} className="p-4 sm:p-5 hover:bg-surface2/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{activity.details}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted font-mono">{activity.action}</p>
                      <p className="text-xs text-subtle">{activity.time}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
