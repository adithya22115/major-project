import React, { useState, useEffect } from 'react';
import { getRequests, updateRequestStatus, approveRequestForQr } from '../../services/requestService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { ClipboardList, Check, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { scanDonationQr } from '../../services/donationQrService';

const PharmacyRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [scanRequest, setScanRequest] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleAction = async (id, status, remarks) => {
    try {
      await updateRequestStatus(id, { status, remarks });
      toast.success(
        status === 'REJECTED'
          ? 'Request rejected & status email sent to recipient'
          : `Request ${status.toLowerCase()} successfully`
      );
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    try {
      setActionLoading(true);
      await updateRequestStatus(rejectModal.id, {
        status: 'REJECTED',
        remarks: rejectRemarks.trim() || 'Prescription verification could not be completed or stock unavailable.'
      });
      toast.success('Request rejected & official notification email sent to patient.');
      setRejectModal(null);
      setRejectRemarks('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveForQr = async (id) => {
    try {
      await approveRequestForQr(id);
      toast.success('Request approved. Scan the matching donation QR at pickup.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const closeScanner = () => {
    const scanner = window.__medicycleQrScanner;
    if (scanner) scanner.stop().catch(() => {}).finally(() => scanner.clear());
    window.__medicycleQrScanner = null;
    setScanRequest(null);
    setScanError('');
  };

  const openScanner = (request) => {
    setScanRequest(request);
    setScanError('');
    setTimeout(() => {
      const scanner = new Html5Qrcode('donation-qr-reader');
      window.__medicycleQrScanner = scanner;
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await scanner.stop();
          window.__medicycleQrScanner = null;
          setScanLoading(true);
          try {
            await scanDonationQr(decodedText, request.id);
            toast.success('QR verified. Medicine dispensed successfully.');
            setScanRequest(null);
            fetchRequests();
          } catch (err) {
            setScanError(err.response?.data?.message || 'QR does not match this request.');
          } finally {
            setScanLoading(false);
          }
        },
        () => {}
      ).catch(() => setScanError('Camera permission was denied or no camera is available.'));
    }, 100);
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
                            onClick={() => handleApproveForQr(request.id)}
                            className="p-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded transition-colors"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => { setRejectModal(request); setRejectRemarks(''); }}
                            className="p-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 rounded transition-colors"
                            title="Reject Request"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {request.status === 'APPROVED' && (
                        <button onClick={() => openScanner(request)} className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded text-xs font-medium transition-colors shadow-md shadow-indigo-600/20">
                          Scan Donation QR
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

      {scanRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-theme shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary">Scan Donation QR</h2>
                <p className="text-sm text-muted mt-1">{scanRequest.medicineName} · {scanRequest.requestedQuantity} units</p>
              </div>
              <button onClick={closeScanner} className="text-muted hover:text-primary text-xl">×</button>
            </div>
            <div id="donation-qr-reader" className="overflow-hidden rounded-xl" />
            {scanLoading && <p className="text-sm text-indigo-400 mt-3">Validating donation and request...</p>}
            {scanError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">{scanError}</p>}
            <p className="text-xs text-muted mt-4">The server checks medicine identity, expiry date, batch quantity, approval status, and remaining donation quantity before dispensing.</p>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-theme shadow-2xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-primary">Reject Medicine Request</h2>
              <p className="text-sm text-muted mt-1">
                Provide a reason for rejecting the request for <span className="font-semibold text-primary">{rejectModal.medicineName}</span>. This reason will be officially emailed to the recipient.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Rejection Reason / Remarks
              </label>
              <textarea
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="e.g. Prescription does not match dosage, stock unavailable, doctor signature unclear..."
                className="w-full px-3.5 py-2.5 bg-surface2 border border-theme rounded-xl text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setRejectModal(null); setRejectRemarks(''); }}
                className="px-4 py-2 text-sm text-muted hover:text-primary rounded-xl border border-theme transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-60"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm & Email Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyRequests;
