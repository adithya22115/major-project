import React, { useState, useEffect } from 'react';
import { getRequests, updateRequestStatus } from '../../services/requestService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { ClipboardList, Check, X } from 'lucide-react';

const PharmacyRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getRequests();
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    try {
      await updateRequestStatus(id, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Medicine Requests</h1>
        <p className="text-muted mt-1">Review and process medicine requests from recipients.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="No requests found" 
              description="There are currently no medicine requests in the system."
              icon={ClipboardList}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">Medicine</th>
                  <th className="px-6 py-3">Requested By</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{request.medicineName}</td>
                    <td className="px-6 py-4 text-muted">{request.recipientName || `User ID: ${request.recipientId}`}</td>
                    <td className="px-6 py-4 font-semibold text-primary">{request.requestedQuantity}</td>
                    <td className="px-6 py-4 text-subtle">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAction(request.id, 'APPROVED')}
                            className="p-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleAction(request.id, 'REJECTED')}
                            className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 rounded transition-colors"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {request.status === 'APPROVED' && (
                        <button 
                          onClick={() => handleAction(request.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded text-xs font-medium transition-colors shadow-md shadow-blue-600/20"
                        >
                          Mark Dispensed
                        </button>
                      )}
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

export default PharmacyRequests;
