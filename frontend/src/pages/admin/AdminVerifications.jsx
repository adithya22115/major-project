import React, { useState, useEffect } from 'react';
import { getPendingVerifications, getAllVerificationsByStatus, approveVerification, rejectVerification } from '../../services/verificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, FileText, ExternalLink, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const AdminVerifications = () => {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchVerifications = async (status) => {
    setLoading(true);
    try {
      const data = status === 'PENDING'
        ? await getPendingVerifications()
        : await getAllVerificationsByStatus(status);
      setVerifications(data);
    } catch (_err) {
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications(activeTab);
  }, [activeTab]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveVerification(id, 'Verified by admin');
      toast.success('Pharmacy verified successfully');
      setVerifications(prev => prev.filter(v => v.id !== id));
    } catch (_err) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(rejectModal);
    try {
      await rejectVerification(rejectModal, rejectRemarks);
      toast.success('Verification rejected');
      setVerifications(prev => prev.filter(v => v.id !== rejectModal));
      setRejectModal(null);
      setRejectRemarks('');
    } catch (_err) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'PENDING', label: 'Pending', icon: Clock },
    { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
    { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Pharmacy Verifications</h1>
        <p className="text-muted mt-1">Review and verify pharmacy accounts based on submitted documents.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-theme pb-0">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'PENDING' && (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full ml-1">
                {verifications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : verifications.length === 0 ? (
        <div className="bg-surface border border-theme rounded-xl p-12 text-center">
          <Shield className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <p className="text-muted font-medium">No {activeTab.toLowerCase()} verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div key={v.id} className="bg-surface border border-theme rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {v.pharmacyName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-primary">{v.pharmacyName}</h3>
                      <p className="text-sm text-muted">{v.userName} • {v.userEmail}</p>
                      <p className="text-xs text-muted mt-1">License: {v.licenseNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    className="text-muted hover:text-primary p-1"
                  >
                    {expandedId === v.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === v.id && (
                <div className="px-5 pb-5 border-t border-theme pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted block text-xs">Address</span><span className="text-primary">{v.pharmacyAddress}</span></div>
                    <div><span className="text-muted block text-xs">City</span><span className="text-primary">{v.city || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">State</span><span className="text-primary">{v.state || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Phone</span><span className="text-primary">{v.contactPhone}</span></div>
                    <div><span className="text-muted block text-xs">Email</span><span className="text-primary">{v.contactEmail}</span></div>
                    <div><span className="text-muted block text-xs">Submitted</span><span className="text-primary">{v.submittedAt ? new Date(v.submittedAt).toLocaleString() : 'N/A'}</span></div>
                  </div>

                  {/* Documents */}
                  {v.documentUrls && v.documentUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted mb-2">Documents ({v.documentUrls.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {v.documentUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-surface2 border border-theme rounded-lg px-3 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate flex-1">{url.split('/').pop()}</span>
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin remarks if already reviewed */}
                  {v.adminRemarks && (
                    <div className="bg-surface2 rounded-lg p-3 text-sm">
                      <span className="text-muted">Admin Remarks: </span>
                      <span className="text-primary">{v.adminRemarks}</span>
                    </div>
                  )}

                  {/* Action buttons for PENDING */}
                  {activeTab === 'PENDING' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(v.id)}
                        disabled={actionLoading === v.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                      >
                        {actionLoading === v.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => { setRejectModal(v.id); setRejectRemarks(''); }}
                        disabled={actionLoading === v.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-lg border border-red-500/30 transition-colors disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-theme rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-primary">Reject Verification</h3>
            <p className="text-sm text-muted">Please provide a reason for rejecting this pharmacy verification.</p>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              placeholder="e.g. License number is invalid, document is blurry..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectRemarks(''); }}
                className="px-4 py-2 text-sm text-muted hover:text-primary border border-theme rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading === rejectModal ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
