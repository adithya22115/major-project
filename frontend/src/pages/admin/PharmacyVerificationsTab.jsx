import React, { useState, useEffect } from 'react';
import {
  getPendingPharmacyVerifications,
  getAllPharmacyVerificationsByStatus,
  approvePharmacyVerification,
  rejectPharmacyVerification
} from '../../services/pharmacyVerificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, FileText, ExternalLink,
  ChevronDown, ChevronUp, Shield, Image, FileIcon, ZoomIn, X, Building2
} from 'lucide-react';

const PharmacyVerificationsTab = () => {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const fetchVerifications = async (status) => {
    setLoading(true);
    try {
      const data = status === 'PENDING'
        ? await getPendingPharmacyVerifications()
        : await getAllPharmacyVerificationsByStatus(status);
      setVerifications(data || []);
    } catch (_err) {
      toast.error('Failed to load pharmacy verifications');
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
      await approvePharmacyVerification(id, 'Verified by admin');
      toast.success('Pharmacy verified and approved successfully');
      setVerifications(prev => prev.filter(v => v.id !== id));
    } catch (_err) {
      toast.error('Failed to approve pharmacy');
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
      await rejectPharmacyVerification(rejectModal, rejectRemarks);
      toast.success('Pharmacy verification rejected');
      setVerifications(prev => prev.filter(v => v.id !== rejectModal));
      setRejectModal(null);
      setRejectRemarks('');
    } catch (_err) {
      toast.error('Failed to reject pharmacy');
    } finally {
      setActionLoading(null);
    }
  };

  const isImageUrl = (url) => {
    const lower = (url || '').toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');
  };

  const isPdfUrl = (url) => {
    return (url || '').toLowerCase().endsWith('.pdf');
  };

  const statusTabs = [
    { key: 'PENDING', label: 'Pending', icon: Clock },
    { key: 'APPROVED', label: 'Approved', icon: CheckCircle },
    { key: 'REJECTED', label: 'Rejected', icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Subtitle & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Pharmacy Verifications
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Review registered pharmacies, verify drug licenses, and approve store operations.
          </p>
        </div>

        <div className="flex gap-1.5 bg-surface2 p-1 rounded-xl border border-theme self-start">
          {statusTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {key === 'PENDING' && verifications.length > 0 && activeTab === 'PENDING' && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1">
                  {verifications.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : verifications.length === 0 ? (
        <div className="bg-surface border border-theme rounded-2xl p-12 text-center">
          <Shield className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <p className="text-muted font-medium">No {activeTab.toLowerCase()} pharmacy verifications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div key={v.id} className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 bg-emerald-500/15 text-emerald-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-primary">{v.pharmacyName}</h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Building2 className="w-3 h-3" /> Pharmacy
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          v.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          v.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-0.5">{v.userName} • {v.userEmail}</p>
                      <p className="text-xs text-muted mt-1">
                        Drug License No: <span className="font-mono text-primary font-medium">{v.licenseNumber}</span>
                      </p>
                      <p className="text-xs text-muted mt-0.5">Documents: <span className="text-primary font-medium">{v.documentUrls?.length || 0}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    className="text-muted hover:text-primary p-2 rounded-lg hover:bg-surface2 transition-colors"
                    title={expandedId === v.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedId === v.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Card Expanded details */}
              {expandedId === v.id && (
                <div className="px-5 pb-5 border-t border-theme pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-surface2/40 p-4 rounded-xl">
                    <div><span className="text-muted block text-xs">Pharmacy Address</span><span className="text-primary font-medium">{v.pharmacyAddress}</span></div>
                    <div><span className="text-muted block text-xs">City</span><span className="text-primary font-medium">{v.city || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">State / Pincode</span><span className="text-primary font-medium">{v.state || 'N/A'} {v.pincode ? `(${v.pincode})` : ''}</span></div>
                    <div><span className="text-muted block text-xs">Contact Phone</span><span className="text-primary font-medium">{v.contactPhone || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Contact Email</span><span className="text-primary font-medium">{v.contactEmail || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Submitted At</span><span className="text-primary font-medium">{v.submittedAt ? new Date(v.submittedAt).toLocaleString() : 'N/A'}</span></div>
                  </div>

                  {/* Documents with inline previews */}
                  {v.documentUrls && v.documentUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted mb-3">Submitted Verification Documents ({v.documentUrls.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {v.documentUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="bg-surface2 border border-theme rounded-xl overflow-hidden group shadow-sm"
                          >
                            {isImageUrl(url) ? (
                              <div className="relative">
                                <img
                                  src={url}
                                  alt={`Document ${idx + 1}`}
                                  className="w-full h-44 object-cover bg-surface2"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden items-center justify-center h-44 bg-surface2">
                                  <div className="text-center">
                                    <Image className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                                    <p className="text-xs text-muted">Preview unavailable</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setLightboxUrl(url)}
                                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <ZoomIn className="w-7 h-7 text-white drop-shadow-lg" />
                                </button>
                              </div>
                            ) : isPdfUrl(url) ? (
                              <div className="bg-red-500/5 border-b border-theme">
                                <iframe
                                  src={url}
                                  title={`Pharmacy verification document ${idx + 1}`}
                                  className="w-full h-44 bg-white"
                                />
                              </div>
                            ) : (
                              <div className="h-44 flex flex-col items-center justify-center bg-blue-500/5 border-b border-theme">
                                <FileIcon className="w-10 h-10 text-blue-400 mb-2" />
                                <p className="text-xs font-semibold text-blue-400">Document</p>
                              </div>
                            )}
                            <div className="p-3 flex items-center justify-between">
                              <span className="text-xs text-muted truncate flex-1 mr-2">
                                {url.split('/').pop()}
                              </span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open pharmacy verification document ${idx + 1}`}
                                className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 font-medium whitespace-nowrap"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No documents warning */}
                  {(!v.documentUrls || v.documentUrls.length === 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <p className="text-sm text-amber-400">No documents were uploaded with this verification request.</p>
                    </div>
                  )}

                  {/* Admin remarks if already reviewed */}
                  {v.adminRemarks && (
                    <div className="bg-surface2 rounded-xl p-3 text-sm">
                      <span className="text-muted">Admin Remarks: </span>
                      <span className="text-primary font-medium">{v.adminRemarks}</span>
                    </div>
                  )}

                  {/* Action buttons for PENDING */}
                  {activeTab === 'PENDING' && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(v.id)}
                        disabled={actionLoading === v.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60"
                      >
                        {actionLoading === v.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve Pharmacy
                      </button>
                      <button
                        onClick={() => { setRejectModal(v.id); setRejectRemarks(''); }}
                        disabled={actionLoading === v.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 text-sm font-semibold rounded-xl border border-red-500/30 transition-all disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Application
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
          <div className="bg-surface border border-theme rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-primary">Reject Pharmacy Application</h3>
            <p className="text-sm text-muted">
              Please provide a specific reason for rejecting this pharmacy application. An official notification will be sent to the applicant.
            </p>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none outline-none"
              rows={4}
              placeholder="e.g. Drug license number could not be validated with state registry..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectRemarks(''); }}
                className="px-4 py-2 text-sm text-muted hover:text-primary border border-theme rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-60"
              >
                {actionLoading === rejectModal ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Document preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default PharmacyVerificationsTab;
