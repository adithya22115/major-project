import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitVerification, getMyVerification } from '../../services/verificationService';
import { uploadFile } from '../../services/fileService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { FileCheck, Upload, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const PharmacyVerification = () => {
  const { user, updateUserLocation } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      const data = await getMyVerification();
      setExistingVerification(data);
      if (data.status === 'REJECTED') {
        setFormData(prev => ({
          ...prev,
          pharmacyName: data.pharmacyName || '',
          licenseNumber: data.licenseNumber || '',
          pharmacyAddress: data.pharmacyAddress || '',
          city: data.city || user?.city || '',
          state: data.state || user?.state || '',
          pincode: data.pincode || user?.pincode || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || user?.email || '',
          documentUrls: data.documentUrls || [],
        }));
      }
    } catch (_err) {
      // No existing verification - fresh form
    }
  };

  useEffect(() => {
    fetchVerification().finally(() => setLoading(false));
  }, [user]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const data = await getMyVerification();
      setExistingVerification(data);
      toast.success('Status refreshed');
      if (data?.status === 'APPROVED') {
        toast.success('🎉 Your pharmacy is now verified! Reloading...');
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
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
      toast.success('Document uploaded');
    } catch (_err) {
      toast.error('Failed to upload document');
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
      toast.error('Please upload at least one document');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitVerification(formData);
      setExistingVerification(result);
      if (user && formData.city) {
        updateUserLocation(formData.city, formData.state, formData.pincode);
      }
      toast.success('Verification submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusBanner = () => {
    if (!existingVerification) return null;

    switch (existingVerification.status) {
      case 'APPROVED':
        return (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-400">Verification Approved</p>
              <p className="text-sm text-muted mt-1">Your pharmacy has been verified. You now have full access to all pharmacy features.</p>
            </div>
          </div>
        );
      case 'PENDING':
        return (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">Verification Under Review</p>
              <p className="text-sm text-muted mt-1">Your verification request is being reviewed by our admin team. This usually takes 1-2 business days.</p>
              {existingVerification.expiresAt && (
                <p className="text-xs text-muted mt-2">Expires: {new Date(existingVerification.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Verification Rejected</p>
              <p className="text-sm text-muted mt-1">
                {existingVerification.adminRemarks || 'Your verification was rejected. Please review the requirements and resubmit.'}
              </p>
              <p className="text-xs text-muted mt-2">You can resubmit with corrected documents below.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isApproved = existingVerification?.status === 'APPROVED';
  const isPending = existingVerification?.status === 'PENDING';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pharmacy Verification</h1>
          <p className="text-muted mt-1">
            Submit your government-issued pharmacy license and documents for admin verification.
          </p>
        </div>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 border border-blue-500/40 rounded-xl hover:bg-blue-500/10 transition-colors disabled:opacity-60"
        >
          {refreshing ? <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : '🔄'}
          {refreshing ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Status Check Section */}
      <div id="status-check-section">
        {statusBanner()}
        {(isApproved || isPending) && existingVerification && (
          <div className="bg-surface border border-theme rounded-xl p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Your Verification Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted">Pharmacy:</span> <span className="text-primary font-medium">{existingVerification.pharmacyName}</span></div>
              <div><span className="text-muted">License:</span> <span className="text-primary font-medium">{existingVerification.licenseNumber}</span></div>
              <div><span className="text-muted">Address:</span> <span className="text-primary font-medium">{existingVerification.pharmacyAddress || 'N/A'}</span></div>
              <div><span className="text-muted">Contact:</span> <span className="text-primary font-medium">{existingVerification.contactPhone || 'N/A'}</span></div>
              <div><span className="text-muted">Status:</span> <span className={isApproved ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>{isApproved ? 'Approved ✓' : 'Pending Review...'}</span></div>
              {existingVerification.submittedAt && <div><span className="text-muted">Submitted:</span> <span className="text-primary font-medium">{new Date(existingVerification.submittedAt).toLocaleDateString()}</span></div>}
            </div>
            {isApproved && (
              <a href="/pharmacy/dashboard" className="mt-4 inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                Go to Pharmacy Dashboard →
              </a>
            )}
          </div>
        )}
      </div>

      {!isPending && !isApproved && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface border border-theme rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <FileCheck className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-primary">Pharmacy Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Pharmacy Name *</label>
                <input name="pharmacyName" type="text" required className={inputClass} value={formData.pharmacyName} onChange={handleChange} placeholder="e.g. MediPlus Pharmacy" />
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
                <input name="pharmacyAddress" type="text" required className={inputClass} value={formData.pharmacyAddress} onChange={handleChange} />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input name="city" type="text" className={inputClass} value={formData.city} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>State</label>
                  <input name="state" type="text" required className={inputClass} value={formData.state} onChange={handleChange} />
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
              <Upload className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-primary">Upload Documents</h2>
            </div>
            <p className="text-xs text-muted mb-5">
              Upload your Drug License, GST Certificate, and any other government-issued pharmacy documents.
              Accepted formats: PDF, JPG, PNG (max 10MB each).
            </p>

            <div className="space-y-3">
              {formData.documentUrls.map((url, index) => (
                <div key={index} className="flex items-center justify-between bg-surface2 border border-theme rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-primary truncate">{url.split('/').pop()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => removeDocument(index)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-theme rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors">
              {uploadingDoc ? (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted" />
              )}
              <span className="text-sm text-muted">{uploadingDoc ? 'Uploading...' : 'Add Document'}</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploadingDoc} />
            </label>

            {formData.documentUrls.length === 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>At least one document is required</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingDoc || isPending}
            className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-all shadow-md shadow-blue-600/20"
          >
            {submitting ? (
              <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : isPending ? (
              'Verification Under Review'
            ) : (
              'Submit for Verification'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default PharmacyVerification;