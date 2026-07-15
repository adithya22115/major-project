import React, { useState, useEffect } from 'react';
import { getRequests } from '../../services/requestService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequests();
        setRequests(data);
      } catch (err) {
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Requests</h1>
          <p className="text-muted mt-1">Track the status of medicines you have requested.</p>
        </div>
        <Link 
          to="/recipient/medicines" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md shadow-blue-600/20"
        >
          Find Medicines
        </Link>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="No requests found" 
              description="You haven't requested any medicines yet."
              icon={ClipboardList}
              action={{ label: 'Browse Medicine Pool', onClick: () => window.location.href = '/recipient/medicines' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">Medicine</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Date Requested</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-primary">{request.medicineName}</div>
                      {request.prescriptionId && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded border border-blue-500/30">Rx Provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-primary font-medium">
                      {request.requestedQuantity}
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 text-muted max-w-xs truncate">
                      {request.status === 'APPROVED' ? 'Ready for pickup' : 
                       request.status === 'REJECTED' ? 'Prescription invalid' : '-'}
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

export default MyRequests;
