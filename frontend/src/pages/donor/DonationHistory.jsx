import React, { useState, useEffect } from 'react';
import { getDonations } from '../../services/donationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { History, Package, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const DonationHistory = () => {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const data = await getDonations();
        setDonations(data);
      } catch (err) {
        toast.error('Failed to load donation history');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Donation History</h1>
          <p className="text-muted mt-1">Track the status of your past medicine donations.</p>
        </div>
        <Link 
          to="/donor/donate" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md shadow-blue-600/20"
        >
          New Donation
        </Link>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {donations.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="No donations found" 
              description="You haven't made any donations yet. Start by donating unused medicines."
              icon={History}
              action={{ label: 'Donate Medicine', onClick: () => window.location.href = '/donor/donate' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">Medicine Info</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Date Donated</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary">{donation.medicineName}</div>
                      <div className="text-xs text-subtle mt-0.5">Batch: {donation.batchNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted">
                        <Package className="h-4 w-4 text-subtle" />
                        {donation.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted">
                        <Calendar className="h-4 w-4 text-subtle" />
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {donation.expiryDate}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={donation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;
