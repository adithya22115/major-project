import React, { useState, useEffect } from 'react';
import {
  getPendingDoctorVerifications,
  getAllDoctorVerificationsByStatus,
  getDoctorVerificationByUserId,
  approveDoctorVerification,
  rejectDoctorVerification
} from '../../services/doctorVerificationService';
import { getUsers, updateUserStatus } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, FileText, ExternalLink,
  ChevronDown, ChevronUp, Shield, Image, FileIcon, ZoomIn, X, Stethoscope, GraduationCap, Award,
  Eye, Lock, AlertCircle
} from 'lucide-react';

const DoctorVerificationsTab = () => {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [viewedDocs, setViewedDocs] = useState({});

  const fetchVerifications = async (status) => {
    setLoading(true);
    try {
      let data = status === 'PENDING'
        ? await getPendingDoctorVerifications()
        : await getAllDoctorVerificationsByStatus(status);
      data = data ? [...data] : [];

      // If pending tab, ensure any unverified doctor users are also included
      if (status === 'PENDING') {
        const allUsers = await getUsers().catch(() => []);
        const unverifiedDoctors = (allUsers || []).filter(u => !u.isVerified && u.role === 'DOCTOR');
        const existingUserIds = new Set(data.map(d => d.userId));

        for (const u of unverifiedDoctors) {
          if (!existingUserIds.has(u.id)) {
            try {
              const dv = await getDoctorVerificationByUserId(u.id);
              if (dv && dv.status === 'PENDING') {
                data.push(dv);
                existingUserIds.add(u.id);
                continue;
              }
            } catch {
              // No existing verification record
            }

            // Include doctor application record so it appears in Doctor Verifications
            data.push({
              id: `user-${u.id}`,
              userId: u.id,
              userName: u.name,
              userEmail: u.email,
              doctorName: u.name,
              registrationNumber: 'Not provided',
              specialization: 'Medical Practitioner',
              qualification: 'MBBS',
              clinicHospitalName: 'Clinic pending submission',
              clinicAddress: u.address || 'Address pending submission',
              city: u.city,
              state: u.state,
              pincode: u.pincode,
              contactPhone: u.phone,
              contactEmail: u.email,
              documentUrls: [],
              status: 'PENDING',
              submittedAt: u.createdAt,
              isUserAccountOnly: true,
            });
            existingUserIds.add(u.id);
          }
        }
      }

      setVerifications(data);
    } catch (_err) {
      toast.error('Failed to load doctor verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications(activeTab);
  }, [activeTab]);

  const markDocViewed = (vId, url) => {
    setViewedDocs(prev => {
      const current = new Set(prev[vId] || []);
      current.add(url);
      return { ...prev, [vId]: current };
    });
  };

  const areAllDocsViewed = (v) => {
    if (!v.documentUrls || v.documentUrls.length === 0) return false;
    const viewed = viewedDocs[v.id] || new Set();
    return v.documentUrls.every(url => viewed.has(url));
  };

  const getViewedCount = (v) => {
    if (!v.documentUrls || v.documentUrls.length === 0) return 0;
    const viewed = viewedDocs[v.id] || new Set();
    return v.documentUrls.filter(url => viewed.has(url)).length;
  };

  const handleApprove = async (verification) => {
    if (!verification.documentUrls || verification.documentUrls.length === 0) {
      toast.error('Cannot approve doctor: No verification documents uploaded.');
      return;
    }
    if (!areAllDocsViewed(verification)) {
      toast.error('Please view and inspect all uploaded documents before approving.');
      return;
    }
    setActionLoading(verification.id);
    try {
      if (verification.isUserAccountOnly) {
        await updateUserStatus(verification.userId, { isVerified: true });
      } else {
        await approveDoctorVerification(verification.id, 'Medical credentials verified by admin after reviewing uploaded documents');
      }
      toast.success('Doctor verified and approved successfully');
      setVerifications(prev => prev.filter(v => v.id !== verification.id));
    } catch (_err) {
      toast.error('Failed to approve doctor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    const finalRemarks = rejectRemarks.trim() || 'Doctor verification application rejected by administrator.';
    setActionLoading(rejectModal);
    try {
      const item = verifications.find(v => v.id === rejectModal);
      if (item?.isUserAccountOnly) {
        await updateUserStatus(item.userId, { isVerified: false });
      } else {
        await rejectDoctorVerification(rejectModal, finalRemarks);
      }
      toast.success('Doctor verification rejected');
      setVerifications(prev => prev.filter(v => v.id !== rejectModal));
      setRejectModal(null);
      setRejectRemarks('');
    } catch (_err) {
      toast.error('Failed to reject doctor');
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
            <Stethoscope className="w-5 h-5 text-indigo-400" />
            Doctor Verifications
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Review certified medical practitioners, verify state medical council registrations, and approve doctor credentials.
          </p>
        </div>

        <div className="flex gap-1.5 bg-surface2 p-1 rounded-xl border border-theme self-start">
          {statusTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
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
          <p className="text-muted font-medium">No {activeTab.toLowerCase()} doctor verifications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div key={v.id} className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 bg-indigo-500/15 text-indigo-400">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-primary">{v.doctorName || 'Dr.'}</h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          <Stethoscope className="w-3 h-3" /> Doctor
                        </span>
                        {v.specialization && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {v.specialization}
                          </span>
                        )}
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
                        Medical Registration No: <span className="font-mono text-primary font-medium">{v.registrationNumber}</span>
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
                    <div><span className="text-muted block text-xs">Specialization</span><span className="text-primary font-medium">{v.specialization || 'General Physician'}</span></div>
                    <div><span className="text-muted block text-xs">Qualification</span><span className="text-primary font-medium">{v.qualification || 'MBBS'}</span></div>
                    <div><span className="text-muted block text-xs">Clinic / Hospital</span><span className="text-primary font-medium">{v.clinicHospitalName || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Clinic Address</span><span className="text-primary font-medium">{v.clinicAddress || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">City / State</span><span className="text-primary font-medium">{v.city || 'N/A'} {v.state ? `, ${v.state}` : ''}</span></div>
                    <div><span className="text-muted block text-xs">Pincode</span><span className="text-primary font-medium">{v.pincode || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Contact Phone</span><span className="text-primary font-medium">{v.contactPhone || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Contact Email</span><span className="text-primary font-medium">{v.contactEmail || 'N/A'}</span></div>
                    <div><span className="text-muted block text-xs">Submitted At</span><span className="text-primary font-medium">{v.submittedAt ? new Date(v.submittedAt).toLocaleString() : 'N/A'}</span></div>
                  </div>

                  {/* Documents with inline previews */}
                  {v.documentUrls && v.documentUrls.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted">
                          Submitted Medical Certificates & Licenses ({v.documentUrls.length})
                        </p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          areAllDocsViewed(v)
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {getViewedCount(v)} of {v.documentUrls.length} Viewed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {v.documentUrls.map((url, idx) => {
                          const isViewed = viewedDocs[v.id]?.has(url);
                          return (
                            <div
                              key={idx}
                              className={`bg-surface2 border rounded-xl overflow-hidden group shadow-sm transition-all ${
                                isViewed ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-theme'
                              }`}
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
                                    onClick={() => {
                                      markDocViewed(v.id, url);
                                      setLightboxUrl(url);
                                    }}
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Click to view & inspect"
                                  >
                                    <ZoomIn className="w-7 h-7 text-white drop-shadow-lg" />
                                  </button>
                                </div>
                              ) : isPdfUrl(url) ? (
                                <div className="bg-red-500/5 border-b border-theme relative group">
                                  <iframe
                                    src={url}
                                    title={`Doctor verification document ${idx + 1}`}
                                    className="w-full h-44 bg-white"
                                  />
                                  <button
                                    onClick={() => {
                                      markDocViewed(v.id, url);
                                      window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                  >
                                    <span className="px-3 py-1.5 rounded-lg bg-black/75 text-white text-xs font-medium flex items-center gap-1.5">
                                      <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                                    </span>
                                  </button>
                                </div>
                              ) : (
                                <div className="h-44 flex flex-col items-center justify-center bg-indigo-500/5 border-b border-theme">
                                  <FileIcon className="w-10 h-10 text-indigo-400 mb-2" />
                                  <p className="text-xs font-semibold text-indigo-400">Document</p>
                                </div>
                              )}
                              <div className="p-3 flex items-center justify-between gap-2">
                                <span className="text-xs text-muted truncate flex-1" title={url.split('/').pop()}>
                                  {url.split('/').pop()}
                                </span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isViewed ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                      <CheckCircle className="w-3 h-3" /> Viewed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                      <Eye className="w-3 h-3" /> Not Viewed
                                    </span>
                                  )}
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => markDocViewed(v.id, url)}
                                    aria-label={`Open doctor verification document ${idx + 1}`}
                                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                  >
                                    View <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Document inspection status alert */}
                      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
                        areAllDocsViewed(v)
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        <div className="flex items-center gap-2">
                          {areAllDocsViewed(v) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span>
                            {areAllDocsViewed(v)
                              ? 'All medical degrees and council certificates have been viewed. Approval is unlocked.'
                              : `Mandatory Credential Verification: You must inspect all medical certificates before approving (${getViewedCount(v)} of ${v.documentUrls.length} viewed). Click "View" on each certificate to inspect.`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No documents warning - Blocks approval */}
                  {(!v.documentUrls || v.documentUrls.length === 0) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-400">Approval Blocked: No medical documents uploaded</p>
                        <p className="text-xs text-red-300/80 mt-0.5">
                          This doctor application cannot be approved without verified medical credentials. Please reject the application to request required documentation.
                        </p>
                      </div>
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
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(v)}
                        disabled={actionLoading === v.id || !areAllDocsViewed(v)}
                        title={
                          !v.documentUrls || v.documentUrls.length === 0
                            ? 'Cannot approve without documents'
                            : !areAllDocsViewed(v)
                            ? `Please view all documents before approving (${getViewedCount(v)}/${v.documentUrls.length} viewed)`
                            : 'Approve doctor credentials'
                        }
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-md ${
                          areAllDocsViewed(v)
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20 cursor-pointer'
                            : 'bg-indigo-600/20 text-indigo-400/50 border border-indigo-500/20 cursor-not-allowed'
                        }`}
                      >
                        {actionLoading === v.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : !areAllDocsViewed(v) ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {areAllDocsViewed(v)
                          ? 'Approve Doctor'
                          : `View Documents to Approve (${getViewedCount(v)}/${v.documentUrls?.length || 0})`}
                      </button>
                      <button
                        onClick={() => { setRejectModal(v.id); setRejectRemarks(''); }}
                        disabled={actionLoading === v.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600/15 hover:bg-red-600/25 text-red-400 text-sm font-semibold rounded-xl border border-red-500/30 transition-all disabled:opacity-60 cursor-pointer"
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
            <h3 className="text-lg font-semibold text-primary">Reject Doctor Application</h3>
            <p className="text-sm text-muted">
              Please provide a specific reason for rejecting this doctor verification application. An official notification will be sent to the applicant.
            </p>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none outline-none"
              rows={4}
              placeholder="e.g. Medical registration number not found in National Medical Commission (NMC) database..."
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

export default DoctorVerificationsTab;
