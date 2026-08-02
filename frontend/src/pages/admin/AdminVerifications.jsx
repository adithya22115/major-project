import React, { useState, useEffect } from 'react';
import { getPendingVerifications, getAllVerificationsByStatus, approveVerification, rejectVerification } from '../../services/verificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, FileText, ExternalLink, ChevronDown, ChevronUp, Shield, Image, FileIcon, ZoomIn, X } from 'lucide-react';

const AdminVerifications = () => {
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

  const isImageUrl = (url) => {
    const lower = url.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');
  };

  const isPdfUrl = (url) => {
    return url.toLowerCase().endsWith('.pdf');
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
                      <p className="text-xs text-muted mt-1">Documents: {v.documentUrls?.length || 0}</p>
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

                  {/* Documents with inline previews */}
                  {v.documentUrls && v.documentUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted mb-3">Uploaded Documents ({v.documentUrls.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {v.documentUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="bg-surface2 border border-theme rounded-xl overflow-hidden group"
                          >
                            {isImageUrl(url) ? (
                              /* Image preview */
                              <div className="relative">
                                <img
                                  src={url}
                                  alt={`Document ${idx + 1}`}
                                  className="w-full h-48 object-cover bg-surface2"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden items-center justify-center h-48 bg-surface2">
                                  <div className="text-center">
                                    <Image className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                                    <p className="text-xs text-muted">Failed to load image</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setLightboxUrl(url)}
                                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                                </button>
                              </div>
                            ) : isPdfUrl(url) ? (
                              /* PDF preview */
                              <div className="h-48 flex flex-col items-center justify-center bg-red-500/5 border-b border-theme">
                                <FileText className="w-12 h-12 text-red-400 mb-2" />
                                <p className="text-xs font-medium text-red-400">PDF Document</p>
                              </div>
                            ) : (
                              /* Generic file */
                              <div className="h-48 flex flex-col items-center justify-center bg-blue-500/5 border-b border-theme">
                                <FileIcon className="w-12 h-12 text-blue-400 mb-2" />
                                <p className="text-xs font-medium text-blue-400">Document</p>
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
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                              >
                                Open <ExternalLink className="w-3 h-3" />
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

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
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
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
