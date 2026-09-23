import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitDoctorVerification, getMyDoctorVerification } from '../../services/doctorVerificationService';
import { uploadFile } from '../../services/fileService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  Stethoscope, Upload, CheckCircle, XCircle, Clock,
  AlertTriangle, ExternalLink, Trash2, ArrowRight
} from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';
const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const DoctorVerification = () => {
  const { user, updateUserLocation } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingVerification, setExistingVerification] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const applicationReceived = location.state?.applicationReceived;

  const [formData, setFormData] = useState({
    doctorName: user?.name || '',
    registrationNumber: '',
    specialization: '',
    qualification: '',
    clinicHospitalName: '',
    clinicAddress: '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    documentUrls: [],
  });

  const fetchVerification = async () => {
    try {
      const data = await getMyDoctorVerification();
      setExistingVerification(data);
      if (data.status === 'REJECTED') {
        setFormData({
          doctorName: data.doctorName || user?.name || '',
          registrationNumber: data.registrationNumber || '',
          specialization: data.specialization || '',
          qualification: data.qualification || '',
          clinicHospitalName: data.clinicHospitalName || '',
          clinicAddress: data.clinicAddress || '',
          city: data.city || user?.city || '',
          state: data.state || user?.state || '',
          pincode: data.pincode || user?.pincode || '',
          contactPhone: data.contactPhone || user?.phone || '',
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
      const data = await getMyDoctorVerification();
      setExistingVerification(data);
      toast.success(`Current status: ${data.status}`);
    } catch (_err) {
      toast.error('Could not refresh status');
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
      const url = result.url || result;
      setFormData(prev => ({
        ...prev,
        documentUrls: [...prev.documentUrls, url],
      }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
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
      toast.error('Please upload at least one credential document');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitDoctorVerification(formData);
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
            <Stethoscope className="w-6 h-6 text-indigo-400" />
            Doctor Credential Verification
          </h1>
          <p className="text-muted mt-1">
            Submit your medical registration certificate and degree documents for admin verification.
          </p>
        </div>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-400 border border-indigo-500/40 rounded-xl hover:bg-indigo-500/10 transition-colors disabled:opacity-60"
        >
          {refreshing ? <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : '🔄'}
          {refreshing ? 'Checking...' : 'Check Status'}
        </button>
      </div>

      {/* Prominent Application Received Banner */}
      {applicationReceived && !isApproved && (
        <div className="bg-gradient-to-r from-indigo-900/40 to-violet-900/40 border border-indigo-500/40 rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Application Has Been Received!</h2>
              <p className="text-sm text-indigo-200 mt-1 leading-relaxed">
                Thank you for applying to the MediCycle Medical Network. Your doctor credentials and documents are currently queued for administrator review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Status Card */}
      {existingVerification && (
        <div className={`p-6 rounded-2xl border ${
          isApproved
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : existingVerification.status === 'REJECTED'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isApproved && <CheckCircle className="w-6 h-6 text-emerald-400" />}
              {existingVerification.status === 'REJECTED' && <XCircle className="w-6 h-6 text-red-400" />}
              {!isApproved && existingVerification.status !== 'REJECTED' && <Clock className="w-6 h-6 text-amber-400" />}
              <div>
                <h3 className="font-semibold text-primary">
                  Status: {existingVerification.status}
                </h3>
                <p className="text-xs text-muted">
                  {isApproved && 'Your medical credentials have been approved. You have full access to the Doctor Workspace.'}
                  {existingVerification.status === 'REJECTED' && 'Your verification was not approved. Please review the remarks below and resubmit.'}
                  {!isApproved && existingVerification.status !== 'REJECTED' && 'Our compliance team is verifying your registration. Turnaround is typically within 24 hours.'}
                </p>
              </div>
            </div>
            {isApproved && (
              <Link
                to="/doctor/dashboard"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {existingVerification.adminRemarks && (
            <div className="bg-surface2 rounded-xl p-4 text-sm mt-3 border border-theme">
              <span className="font-semibold text-primary block mb-1">Administrator Remarks:</span>
              <span className="text-muted">{existingVerification.adminRemarks}</span>
            </div>
          )}
        </div>
      )}

      {/* Existing Verification Summary */}
      {existingVerification && (
        <div className="bg-surface border border-theme rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-subtle uppercase tracking-wider mb-4">Submitted Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted">Doctor Name:</span> <span className="text-primary font-medium">{existingVerification.doctorName}</span></div>
            <div><span className="text-muted">Medical Reg. Number:</span> <span className="text-primary font-medium">{existingVerification.registrationNumber}</span></div>
            <div><span className="text-muted">Specialization:</span> <span className="text-primary font-medium">{existingVerification.specialization || 'General'}</span></div>
            <div><span className="text-muted">Clinic / Hospital:</span> <span className="text-primary font-medium">{existingVerification.clinicHospitalName || 'N/A'}</span></div>
            <div><span className="text-muted">Clinic Address:</span> <span className="text-primary font-medium">{existingVerification.clinicAddress || 'N/A'}</span></div>
            <div><span className="text-muted">Contact:</span> <span className="text-primary font-medium">{existingVerification.contactPhone || 'N/A'}</span></div>
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
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs">
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
              <Stethoscope className="w-5 h-5 text-indigo-400" />
              Doctor & Clinic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Doctor Name *</label>
                <input name="doctorName" type="text" required className={inputClass} value={formData.doctorName} onChange={handleChange} placeholder="Dr. Full Name" />
              </div>

              <div>
                <label className={labelClass}>Medical Registration Number *</label>
                <input name="registrationNumber" type="text" required className={inputClass} value={formData.registrationNumber} onChange={handleChange} placeholder="e.g. MCI/2024/12345" />
              </div>

              <div>
                <label className={labelClass}>Specialization</label>
                <input name="specialization" type="text" className={inputClass} value={formData.specialization} onChange={handleChange} placeholder="e.g. General Medicine, Pediatrics" />
              </div>

              <div>
                <label className={labelClass}>Clinic / Hospital Name</label>
                <input name="clinicHospitalName" type="text" className={inputClass} value={formData.clinicHospitalName} onChange={handleChange} placeholder="Clinic or Hospital" />
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
                <label className={labelClass}>Clinic Address *</label>
                <input name="clinicAddress" type="text" required className={inputClass} value={formData.clinicAddress} onChange={handleChange} placeholder="Clinic or hospital location" />
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
            <h2 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Medical License & Degree Certificates
            </h2>
            <p className="text-sm text-muted mb-4">
              Upload copies of your Medical Council Registration Certificate, MBBS/MD degree, or Clinic registration (PDF, PNG, JPG under 5MB).
            </p>

            <div className="border-2 border-dashed border-theme hover:border-indigo-500/50 rounded-xl p-6 text-center transition-colors">
              <input
                type="file"
                id="doc-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploadingDoc}
              />
              <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-muted mb-2" />
                <span className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                  {uploadingDoc ? 'Uploading document...' : 'Click to upload credential documents'}
                </span>
                <span className="text-xs text-subtle mt-1">PDF, JPG, PNG up to 5MB</span>
              </label>
            </div>

            {formData.documentUrls.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.documentUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-surface2 rounded-lg border border-theme text-sm">
                    <span className="text-primary truncate">{url.split('/').pop()}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting Application...' : 'Submit Doctor Verification Application'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DoctorVerification;
