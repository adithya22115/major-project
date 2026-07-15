import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDonations } from '../../services/donationService';
import { getRequests } from '../../services/requestService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { toast } from 'react-hot-toast';
import { Clock, Package, ClipboardList, CheckCircle, ShieldCheck } from 'lucide-react';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, inventory: 0, requests: 0, verified: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [donationsData, requestsData] = await Promise.all([
          getDonations(),
          getRequests()
        ]);
        
        const pending = donationsData.filter(d => d.status === 'PENDING' || d.status === 'UNDER_REVIEW');
        setPendingDonations(pending);
        
        const active = requestsData.filter(r => r.status === 'PENDING' || r.status === 'APPROVED');
        setActiveRequests(active);
        
        setStats({
          pending: pending.length,
          inventory: 124, 
          requests: active.length,
          verified: donationsData.filter(d => d.status === 'APPROVED').length
        });
      } catch (err) {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{user?.name} Dashboard</h1>
          <p className="text-muted mt-1">Manage verifications, inventory, and medicine requests.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Pending Verification" value={stats.pending} icon={Clock} color="amber" />
        <StatsCard title="Inventory Items" value={stats.inventory} icon={Package} color="blue" />
        <StatsCard title="Active Requests" value={stats.requests} icon={ClipboardList} color="purple" />
        <StatsCard title="Successfully Verified" value={stats.verified} icon={ShieldCheck} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Verifications */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-lg font-semibold text-primary">Pending Verifications</h2>
            <Link to="/pharmacy/pending" className="text-sm font-medium text-blue-500 hover:text-blue-400">View All</Link>
          </div>
          
          {pendingDonations.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                title="No pending verifications" 
                description="All donated medicines have been verified."
                icon={ShieldCheck}
              />
            </div>
          ) : (
            <div className="divide-y divide-theme">
              {pendingDonations.slice(0, 5).map((donation) => (
                <div key={donation.id} className="p-4 hover:bg-surface2/40 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-primary">{donation.medicineName}</h3>
                    <p className="text-xs text-subtle mt-1">
                      Qty: {donation.quantity} • Exp: {donation.expiryDate}
                    </p>
                  </div>
                  <Link 
                    to={`/pharmacy/pending/${donation.id}`}
                    className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded text-sm font-medium border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medicine Requests */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-lg font-semibold text-primary">Active Requests</h2>
            <Link to="/pharmacy/requests" className="text-sm font-medium text-blue-500 hover:text-blue-400">View All</Link>
          </div>
          
          {activeRequests.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                title="No active requests" 
                description="There are currently no pending medicine requests to process."
                icon={ClipboardList}
              />
            </div>
          ) : (
            <div className="divide-y divide-theme">
              {activeRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-4 hover:bg-surface2/40 transition-colors flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-primary">{request.medicineName}</h3>
                    <p className="text-xs text-subtle mt-1">
                      Requested: {request.requestedQuantity} • {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default PharmacyDashboard;
