import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitPharmacyVerification, getMyPharmacyVerification } from '../../services/pharmacyVerificationService';
import { uploadFile } from '../../services/fileService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  Building2, Upload, CheckCircle, XCircle, Clock,
  AlertTriangle, ExternalLink, Trash2, ArrowRight
} from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors';
const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const PharmacyVerification = () => {
  const { user, updateUserLocation } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const applicationReceived = location.state?.applicationReceived;

  const [formData, setFormData] = useState({
    pharmacyName: '',
    licenseNumber: '',
    pharmacyAddress: '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    contactPhone: '',
    contactEmail: user?.email || '',
    documentUrls: [],
  });

  const fetchVerification = async () => {
    try {
      const data = await getMyPharmacyVerification();
      setExistingVerification(data);
      if (data.status === 'REJECTED') {
        setFormData({
          pharmacyName: data.pharmacyName || '',
          licenseNumber: data.licenseNumber || '',
          pharmacyAddress: data.pharmacyAddress || '',
          city: data.city || user?.city || '',
          state: data.state || user?.state || '',
          pincode: data.pincode || user?.pincode || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || user?.email || '',
          documentUrls: data.documentUrls || [],
        });
      }
    } catch (_err) {
      // No verification yet
    }
  };

  useEffect(() => {
    fetchVerification().finally(() => setLoading(false));
  }, [user]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const data = await getMyPharmacyVerification();
      setExistingVerification(data);
      toast.success('Status updated');
      if (data?.status === 'APPROVED') {
        toast.success('🎉 Your pharmacy license has been approved! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (_err) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setUploadingDoc(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const result = await uploadFile(formDataUpload, 'verification-docs');
      setFormData(prev => ({
        ...prev,
        documentUrls: [...prev.documentUrls, result.url || result],
      }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload document. Please try again.';
      toast.error(msg);
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documentUrls: prev.documentUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.documentUrls.length === 0) {
      toast.error('Please upload at least one license document');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitPharmacyVerification({
        ...formData,
      });
      setExistingVerification(result);
      if (user && formData.city) {
        updateUserLocation(formData.city, formData.state, formData.pincode);
      }
      toast.success('Your application has been received and submitted for verification!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isApproved = existingVerification?.status === 'APPROVED';
  const isPending = existingVerification?.status === 'PENDING' || (applicationReceived && !existingVerification);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Pharmacy License Verification
          </h1>
          <p className="text-muted mt-1">
            Submit your government-issued pharmacy license and regulatory documents for admin verification.
          </p>
        </div>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-400 border border-emerald-500/40 rounded-xl hover:bg-emerald-500/10 transition-colors disabled:opacity-60"
        >
          {refreshing ? <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : '🔄'}
          {refreshing ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Prominent Application Received Banner */}
      {isPending && (
        <div className="bg-surface border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-md">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" />
                Application Received & Under Review
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary">Your Application Has Been Received!</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                Thank you for applying. We have received your pharmacy registration and drug license documents. Our administrative verification team is currently reviewing your submission.
              </p>

              {/* Progress Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-theme">
                <div className="p-3 bg-surface2 rounded-xl border border-theme flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-primary">1. Submitted</p>
                    <p className="text-[11px] text-muted">Application uploaded</p>
                  </div>
                </div>
                <div className="p-3 bg-surface2 rounded-xl border border-amber-500/30 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                    ⏳
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-amber-400">2. Admin Review</p>
                    <p className="text-[11px] text-muted">Usually 24-48 hours</p>
                  </div>
                </div>
                <div className="p-3 bg-surface2 rounded-xl border border-theme flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-full bg-surface text-muted flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-muted">3. Approved</p>
                    <p className="text-[11px] text-muted">Pharmacy portal access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approved Banner */}
      {isApproved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-400">Pharmacy License Approved</p>
            <p className="text-sm text-muted mt-1">
              Your pharmacy has been verified. You now have full access to manage medicine inventory and verify donation drop-offs.
            </p>
            <Link
              to="/pharmacy/dashboard"
              className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors shadow-md shadow-emerald-600/20"
            >
              Open Pharmacy Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Rejected Banner */}
      {existingVerification?.status === 'REJECTED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-400">Verification Rejected</p>
            <p className="text-sm text-muted mt-1">
              {existingVerification.adminRemarks || 'Your verification was not approved. Please review the documents and resubmit below.'}
            </p>
          </div>
        </div>
      )}

      {/* Existing Details Card */}
      {(isApproved || isPending) && existingVerification && (
        <div className="bg-surface border border-theme rounded-xl p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Pharmacy Verification Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Pharmacy Name:</span> <span className="text-primary font-medium">{existingVerification.pharmacyName}</span></div>
            <div><span className="text-muted">Drug License No:</span> <span className="text-primary font-medium">{existingVerification.licenseNumber}</span></div>
            <div><span className="text-muted">Store Address:</span> <span className="text-primary font-medium">{existingVerification.pharmacyAddress || 'N/A'}</span></div>
            <div><span className="text-muted">Contact Phone:</span> <span className="text-primary font-medium">{existingVerification.contactPhone || 'N/A'}</span></div>
            <div><span className="text-muted">Status:</span> <span className={isApproved ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{isApproved ? 'Approved ✓' : 'Under Review ⏳'}</span></div>
            {existingVerification.submittedAt && <div><span className="text-muted">Submitted On:</span> <span className="text-primary font-medium">{new Date(existingVerification.submittedAt).toLocaleDateString()}</span></div>}
          </div>

          {/* Uploaded Documents */}
          {existingVerification.documentUrls?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-theme">
              <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Submitted Documents</h3>
              <div className="space-y-2">
                {existingVerification.documentUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface2 rounded-lg border border-theme text-sm">
                    <span className="text-primary truncate">{url.split('/').pop()}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-xs">
                      View <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form (only shown if not pending and not approved, or resubmission) */}
      {(!isPending && !isApproved) && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface border border-theme rounded-xl p-6">
            <h2 className="text-lg font-semibold text-primary mb-5 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Pharmacy Store Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Pharmacy Business Name *</label>
                <input name="pharmacyName" type="text" required className={inputClass} value={formData.pharmacyName} onChange={handleChange} placeholder="e.g. Apex Health Pharmacy" />
              </div>

              <div>
                <label className={labelClass}>Drug License Number *</label>
                <input name="licenseNumber" type="text" required className={inputClass} value={formData.licenseNumber} onChange={handleChange} placeholder="e.g. 20B/MH/12345" />
              </div>

              <div>
                <label className={labelClass}>Contact Phone *</label>
                <input name="contactPhone" type="text" required className={inputClass} value={formData.contactPhone} onChange={handleChange} />
              </div>

              <div>
                <label className={labelClass}>Contact Email *</label>
                <input name="contactEmail" type="email" required className={inputClass} value={formData.contactEmail} onChange={handleChange} />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Pharmacy Address *</label>
                <input name="pharmacyAddress" type="text" required className={inputClass} value={formData.pharmacyAddress} onChange={handleChange} placeholder="Store address" />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input name="city" type="text" className={inputClass} value={formData.city} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>State</label>
                  <input name="state" type="text" className={inputClass} value={formData.state} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input name="pincode" type="text" className={inputClass} value={formData.pincode} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-surface border border-theme rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-primary">Upload Verification Documents</h2>
            </div>
            <p className="text-xs text-muted mb-5">
              Upload your Drug License (Form 20/21) and GST Certificate. Accepted: PDF, JPG, PNG (max 10MB each).
            </p>

            <div className="space-y-3">
              {formData.documentUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-surface2 border border-theme rounded-lg px-4 py-3">
                  <span className="text-sm text-primary truncate">{url.split('/').pop()}</span>
                  <div className="flex items-center gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => removeDocument(index)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-theme rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
              {uploadingDoc ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted" />
              )}
              <span className="text-sm text-muted">{uploadingDoc ? 'Uploading...' : 'Add Document'}</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploadingDoc} />
            </label>

            {formData.documentUrls.length === 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>At least one document is required for verification</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingDoc || isPending}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20"
          >
            {submitting ? (
              <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : isPending ? (
              'Verification Under Review'
            ) : (
              'Submit Pharmacy Verification'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default PharmacyVerification;
