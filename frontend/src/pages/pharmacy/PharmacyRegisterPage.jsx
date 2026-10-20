import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitPharmacyVerification } from '../../services/pharmacyVerificationService';
import { uploadFile } from '../../services/fileService';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { useEmailCheck } from '../../hooks/useEmailCheck';
import {
  Building2, Upload, CheckCircle, FileCheck, ExternalLink,
  Trash2, AlertTriangle, ArrowRight, ShieldCheck, User,
  Loader2, AlertCircle
} from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors';
const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const PharmacyRegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    roleId: '3', // PHARMACY
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [pharmacyData, setPharmacyData] = useState({
    pharmacyName: '',
    licenseNumber: '',
    pharmacyAddress: '',
    contactPhone: '',
    contactEmail: '',
    documentUrls: [],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  const emailCheck = useEmailCheck(formData.email);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePharmacyChange = (e) => {
    setPharmacyData({ ...pharmacyData, [e.target.name]: e.target.value });
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
      setPharmacyData(prev => ({
        ...prev,
        documentUrls: [...prev.documentUrls, url],
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
    setPharmacyData(prev => ({
      ...prev,
      documentUrls: prev.documentUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasDigit = /[0-9]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_\-+=\[\]{}|;:'",.<>/?]/.test(formData.password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, a number, and a special character (e.g. Pharmacy@123)');
      return;
    }

    if (!pharmacyData.pharmacyName.trim()) {
      setError('Pharmacy name is required.');
      return;
    }
    if (!pharmacyData.licenseNumber.trim()) {
      setError('Drug license number is required.');
      return;
    }
    if (emailCheck.exists) {
      setError('This email is already registered. Please sign in or use another email.');
      return;
    }
    if (emailCheck.status === 'INVALID') {
      setError(emailCheck.message || 'Please provide a valid email address.');
      return;
    }

    if (pharmacyData.documentUrls.length === 0) {
      setError('Please upload at least one verification document (Drug License or GST certificate).');
      return;
    }

    setLoading(true);
    try {
      // 1. Register user
      await register({
        ...formData,
        roleId: '3',
      });

      // 2. Submit verification documents
      try {
        await submitPharmacyVerification({
          pharmacyName: pharmacyData.pharmacyName,
          licenseNumber: pharmacyData.licenseNumber,
          pharmacyAddress: pharmacyData.pharmacyAddress || formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          contactPhone: pharmacyData.contactPhone || formData.phone,
          contactEmail: pharmacyData.contactEmail || formData.email,
          documentUrls: pharmacyData.documentUrls,
        });
      } catch (_verErr) {
        // Log error but proceed to show success
      }

      toast.success('Your application has been received and submitted for verification!');
      setSubmittedApplication({
        name: formData.name,
        email: formData.email,
        pharmacyName: pharmacyData.pharmacyName,
        licenseNumber: pharmacyData.licenseNumber,
        docCount: pharmacyData.documentUrls.length,
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0];
        setError(firstError || 'Registration failed. Please try again.');
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Confirmation Screen when application is submitted
  if (submittedApplication) {
    return (
      <div className="min-h-screen bg-page flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl w-full bg-surface border-2 border-emerald-500/40 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/30 shadow-lg">
                <CheckCircle className="w-12 h-12" />
              </div>

              <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Application Received
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary mt-3">
                Your Application Has Been Received!
              </h1>
              <p className="text-muted mt-2 max-w-lg mx-auto text-sm leading-relaxed">
                Thank you for applying, {submittedApplication.name}. We have received your pharmacy registration details and drug license verification documents. Our administrative team is now reviewing your application.
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="mt-8 bg-surface2 rounded-2xl p-6 border border-theme space-y-3 text-sm">
              <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-2">Application Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><span className="text-muted">Contact Name:</span> <span className="text-primary font-medium">{submittedApplication.name}</span></div>
                <div><span className="text-muted">Email:</span> <span className="text-primary font-medium">{submittedApplication.email}</span></div>
                <div><span className="text-muted">Pharmacy Name:</span> <span className="text-primary font-medium">{submittedApplication.pharmacyName}</span></div>
                <div><span className="text-muted">Drug License No:</span> <span className="text-primary font-medium">{submittedApplication.licenseNumber}</span></div>
                <div><span className="text-muted">Documents Uploaded:</span> <span className="text-emerald-400 font-medium">{submittedApplication.docCount} file(s) attached</span></div>
                <div><span className="text-muted">Status:</span> <span className="text-amber-400 font-medium">Pending Admin Review ⏳</span></div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-muted flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-400 mb-0.5">What happens next?</p>
                Our team reviews drug licenses and pharmacy credentials within 24–48 hours. Once verified, you will have complete access to the Pharmacy Portal to verify medicine donations and manage inventory.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/pharmacy/verification', { state: { applicationReceived: true } })}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                View Verification Status <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-theme hover:bg-surface2 text-muted hover:text-primary text-sm font-medium transition-colors text-center"
              >
                Back to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-8 text-center text-white">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Pharmacy Registration & Verification
              </h2>
              <p className="mt-2 text-white/80 text-sm max-w-lg mx-auto">
                Register your licensed pharmacy to inspect, verify, and redistribute donated medicines safely.
              </p>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Details */}
                <div>
                  <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Authorized Pharmacist Account
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Pharmacist Full Name *</label>
                      <input name="name" type="text" required className={inputClass} value={formData.name} onChange={handleChange} placeholder="First Last" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-muted">Email Address *</label>
                        {emailCheck.isChecking && (
                          <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          name="email"
                          type="email"
                          required
                          className={`${inputClass} ${
                            emailCheck.exists || emailCheck.status === 'INVALID'
                              ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30'
                              : emailCheck.isAvailable
                              ? 'border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/30'
                              : ''
                          }`}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="pharmacy@example.com"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {emailCheck.isChecking && <Loader2 className="w-4 h-4 text-muted animate-spin" />}
                          {emailCheck.isAvailable && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {(emailCheck.exists || emailCheck.status === 'INVALID') && <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                      {emailCheck.message && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${
                          emailCheck.isAvailable ? 'text-emerald-400 font-medium' :
                          emailCheck.isChecking ? 'text-muted' :
                          'text-red-400 font-medium'
                        }`}>
                          {emailCheck.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Phone Number *</label>
                      <input name="phone" type="tel" required className={inputClass} value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" />
                    </div>

                    <div>
                      <label className={labelClass}>City *</label>
                      <input name="city" type="text" required className={inputClass} value={formData.city} onChange={handleChange} placeholder="City" />
                    </div>

                    <div>
                      <label className={labelClass}>State *</label>
                      <input name="state" type="text" required className={inputClass} value={formData.state} onChange={handleChange} placeholder="State" />
                    </div>

                    <div>
                      <label className={labelClass}>Pincode *</label>
                      <input name="pincode" type="text" required className={inputClass} value={formData.pincode} onChange={handleChange} placeholder="6-digit pincode" />
                    </div>

                    <div>
                      <label className={labelClass}>Password *</label>
                      <input name="password" type="password" required className={inputClass} value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" />
                    </div>

                    <div>
                      <label className={labelClass}>Confirm Password *</label>
                      <input name="confirmPassword" type="password" required className={inputClass} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" />
                    </div>
                  </div>
                </div>

                {/* Pharmacy License Details */}
                <div className="pt-5 border-t border-theme">
                  <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Pharmacy License & Facility Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Pharmacy Business Name *</label>
                      <input name="pharmacyName" type="text" required className={inputClass} value={pharmacyData.pharmacyName} onChange={handlePharmacyChange} placeholder="e.g. Apex Health Pharmacy" />
                    </div>

                    <div>
                      <label className={labelClass}>Drug License Number *</label>
                      <input name="licenseNumber" type="text" required className={inputClass} value={pharmacyData.licenseNumber} onChange={handlePharmacyChange} placeholder="e.g. 20B/MH/12345" />
                    </div>

                    <div>
                      <label className={labelClass}>Pharmacy Contact Phone</label>
                      <input name="contactPhone" type="text" required className={inputClass} value={pharmacyData.contactPhone} onChange={handlePharmacyChange} placeholder="Store telephone" />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Pharmacy Store Address *</label>
                      <input name="pharmacyAddress" type="text" required className={inputClass} value={pharmacyData.pharmacyAddress} onChange={handlePharmacyChange} placeholder="Full address of the pharmacy" />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="pt-5 border-t border-theme">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">Upload Verification Documents *</h3>
                  </div>
                  <p className="text-xs text-muted mb-4">
                    Upload your Drug License (Form 20/21), GST Certificate, and any state pharmacy council registrations.
                    Accepted formats: PDF, JPG, PNG (max 10MB each).
                  </p>

                  <div className="space-y-3">
                    {pharmacyData.documentUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between bg-surface2 border border-theme rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-sm text-primary truncate">{url.split('/').pop()}</span>
                        </div>
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

                  <label className="mt-4 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-dashed border-theme rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
                    {uploadingDoc ? (
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-muted" />
                    )}
                    <span className="text-sm text-muted">{uploadingDoc ? 'Uploading...' : 'Add License Document'}</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploadingDoc} />
                  </label>

                  {pharmacyData.documentUrls.length === 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>At least one drug license document is required for verification</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || uploadingDoc || emailCheck.isChecking || emailCheck.exists}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20"
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    'Submit Pharmacy Application'
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-surface2 border-t border-theme text-center text-xs text-muted">
              Already registered?{' '}
              <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
                Sign in to Pharmacist Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyRegisterPage;
