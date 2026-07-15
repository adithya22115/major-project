import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDonations } from '../../services/donationService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { Gift, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';

const DonorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDonations();
        setDonations(data);
        const total    = data.length;
        const approved = data.filter(d => d.status === 'APPROVED' || d.status === 'DISTRIBUTED').length;
        const pending  = data.filter(d => d.status === 'PENDING'  || d.status === 'UNDER_REVIEW').length;
        const rejected = data.filter(d => d.status === 'REJECTED' || d.status === 'EXPIRED').length;
        setStats({ total, approved, pending, rejected });
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome back, {user?.name}!</h1>
          <p className="text-muted mt-1">Here's an overview of your donation activity.</p>
        </div>
        <Link
          to="/donor/donate"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-blue-600/20"
        >
          <Plus className="h-5 w-5" />
          Donate Medicine
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Total Donations"    value={stats.total}    icon={Gift}         color="blue"  />
        <StatsCard title="Approved"           value={stats.approved} icon={CheckCircle}  color="green" />
        <StatsCard title="Pending Review"     value={stats.pending}  icon={Clock}        color="amber" />
        <StatsCard title="Rejected/Expired"   value={stats.rejected} icon={XCircle}      color="red"   />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Donations Table */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-lg font-semibold text-primary">Recent Donations</h2>
            <Link to="/donor/donations" className="text-sm font-medium text-blue-500 hover:text-blue-400">View All</Link>
          </div>

          {donations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No donations yet"
                description="Start making a difference by donating your unused medicines."
                icon={Gift}
                action={{ label: 'Donate Now', onClick: () => window.location.href = '/donor/donate' }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                  <tr>
                    <th className="px-6 py-3">Medicine</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {donations.slice(0, 5).map((donation) => (
                    <tr key={donation.id} className="hover:bg-surface2/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary">{donation.medicineName}</td>
                      <td className="px-6 py-4 text-muted">{donation.quantity} units</td>
                      <td className="px-6 py-4 text-subtle">{new Date(donation.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><StatusBadge status={donation.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar cards */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-surface rounded-xl shadow-sm border border-theme p-6">
            <h3 className="text-base font-semibold text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/donor/donate"
                className="flex items-center gap-3 p-3 rounded-lg border border-theme hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors group"
              >
                <div className="bg-blue-500/15 p-2 rounded-md group-hover:bg-blue-500/25 transition-colors">
                  <Gift className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-primary text-sm">Make a Donation</p>
                  <p className="text-xs text-muted">Donate unused medicine</p>
                </div>
              </Link>
              <Link
                to="/donor/donations"
                className="flex items-center gap-3 p-3 rounded-lg border border-theme hover:border-theme hover:bg-surface2/50 transition-colors group"
              >
                <div className="bg-surface2 p-2 rounded-md group-hover:bg-surface2/80 transition-colors">
                  <Clock className="h-5 w-5 text-muted" />
                </div>
                <div>
                  <p className="font-medium text-primary text-sm">Donation History</p>
                  <p className="text-xs text-muted">Track your past donations</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Impact Banner */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-300" />
              Your Impact
            </h3>
            <p className="text-blue-200 text-sm mb-4">
              You've helped redistribute potentially life-saving medication to those who need it most.
            </p>
            <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm border border-white/20">
              <p className="text-3xl font-bold">
                ${stats.approved * 10}{' '}
                <span className="text-sm font-normal text-blue-200">estimated value</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
