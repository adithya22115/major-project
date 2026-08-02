import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitVerification } from '../../services/verificationService';
import { uploadFile } from '../../services/fileService';
import Navbar from '../../components/common/Navbar';
import { toast } from 'react-hot-toast';
import { Heart, Package, Store, UserPlus, Upload, FileCheck, ExternalLink, Trash2, AlertTriangle, Shield } from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    roleId: '3', address: '', city: '', state: '', pincode: ''
  });

  // Pharmacy verification fields
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
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isPharmacy = formData.roleId === '3';

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePharmacyChange = (e) =>
    setPharmacyData({ ...pharmacyData, [e.target.name]: e.target.value });

  const handleFileUpload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
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
      setPharmacyData(prev => ({
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
      setError('Password must contain uppercase, lowercase, a number, and a special character (e.g. Admin@123)');
      return;
    }

    // Pharmacy-specific validations
    if (isPharmacy) {
      if (!pharmacyData.pharmacyName.trim()) {
        setError('Pharmacy name is required.');
        return;
      }
      if (!pharmacyData.licenseNumber.trim()) {
        setError('Drug license number is required.');
        return;
      }
      if (pharmacyData.documentUrls.length === 0) {
        setError('Please upload at least one verification document (drug license, GST certificate, etc.).');
        return;
      }
    }

    setLoading(true);
    try {
      // Step 1: Register the account
      const response = await register(formData);

      // Step 2: If pharmacy, auto-submit verification
      if (isPharmacy) {
        try {
          await submitVerification({
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
          toast.success('Registration and verification submitted successfully!');
        } catch (_verErr) {
          // Account was created but verification failed - still redirect
          toast.error('Account created, but verification submission failed. Please submit from your dashboard.');
        }
      }

      // Redirect based on role
      const role = response.user?.role;
      let redirectPath = '/';
      if (role === 'PHARMACY')       redirectPath = '/pharmacy/verification';
      else if (role === 'DONOR')     redirectPath = '/donor/dashboard';
      else if (role === 'RECIPIENT') redirectPath = '/recipient/dashboard';
      
      // Delay navigation slightly to ensure auth state updates
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 50);
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



  return (
    <div className="min-h-screen bg-page flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className={`w-full ${isPharmacy ? 'max-w-3xl' : 'max-w-2xl'}`}>
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">

            {/* Card Header */}
            <div className={`px-6 py-8 text-center ${isPharmacy ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : 'bg-gradient-to-r from-blue-700 to-indigo-800'}`}>
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                {isPharmacy ? <Store className="h-8 w-8 text-white" /> : <UserPlus className="h-8 w-8 text-white" />}
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {isPharmacy ? 'Register Your Pharmacy' : 'Create an Account'}
              </h2>
              <p className="mt-2 text-white/70">
                {isPharmacy
                  ? 'Create your account and submit verification documents in one step'
                  : 'Join MediCycle and start making a difference'}
              </p>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form className="space-y-7" onSubmit={handleSubmit}>



                {/* Account Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-theme">
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Account Information</h3>
                  </div>

                  <div>
                    <label className={labelClass}>{isPharmacy ? 'Owner / Pharmacist Name' : 'Full Name (or Organization)'}</label>
                    <input name="name" type="text" required className={inputClass} value={formData.name} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input name="email" type="email" required className={inputClass} value={formData.email} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Password</label>
                    <input name="password" type="password" required minLength={8} className={inputClass} value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" />
                    <p className="mt-1.5 text-xs text-subtle">Must include uppercase, lowercase, number &amp; special character (e.g. <span className="font-mono">Admin@123</span>)</p>
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input name="confirmPassword" type="password" required className={inputClass} value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input name="phone" type="text" required className={inputClass} value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                {/* Pharmacy Details — only shown when Pharmacy role selected */}
                {isPharmacy && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-theme">
                    <div className="md:col-span-2">
                      <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        Pharmacy Verification Details
                      </h3>
                      <p className="text-xs text-muted mb-3">This information will be reviewed by our admin team for verification.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Pharmacy Name *</label>
                      <input name="pharmacyName" type="text" required className={inputClass} value={pharmacyData.pharmacyName} onChange={handlePharmacyChange} placeholder="e.g. MediPlus Pharmacy" />
                    </div>

                    <div>
                      <label className={labelClass}>Drug License Number *</label>
                      <input name="licenseNumber" type="text" required className={inputClass} value={pharmacyData.licenseNumber} onChange={handlePharmacyChange} placeholder="e.g. 20B/MH/12345" />
                    </div>

                    <div>
                      <label className={labelClass}>Pharmacy Contact Phone</label>
                      <input name="contactPhone" type="text" required className={inputClass} value={pharmacyData.contactPhone} onChange={handlePharmacyChange} placeholder="Pharmacy phone" />
                    </div>

                    <div>
                      <label className={labelClass}>Pharmacy Contact Email</label>
                      <input name="contactEmail" type="email" required className={inputClass} value={pharmacyData.contactEmail} onChange={handlePharmacyChange} placeholder="Pharmacy email" />
                    </div>

                    <div>
                      <label className={labelClass}>Pharmacy Address</label>
                      <input name="pharmacyAddress" type="text" required className={inputClass} value={pharmacyData.pharmacyAddress} onChange={handlePharmacyChange} placeholder="Shop/building address" />
                    </div>
                  </div>
                )}

                {/* Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-theme">
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Location Details</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Street Address</label>
                    <input name="address" type="text" required className={inputClass} value={formData.address} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>City</label>
                    <input name="city" type="text" required className={inputClass} value={formData.city} onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>State</label>
                      <input name="state" type="text" required className={inputClass} value={formData.state} onChange={handleChange} />
                    </div>
                    <div>
                      <label className={labelClass}>Pincode</label>
                      <input name="pincode" type="text" required className={inputClass} value={formData.pincode} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {/* Document Upload — only for Pharmacy */}
                {isPharmacy && (
                  <div className="pt-5 border-t border-theme">
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">Upload Verification Documents *</h3>
                    </div>
                    <p className="text-xs text-muted mb-4">
                      Upload your Drug License, GST Certificate, and any other government-issued pharmacy documents.
                      Accepted: PDF, JPG, PNG (max 10MB each).
                    </p>

                    <div className="space-y-3">
                      {pharmacyData.documentUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-surface2 border border-theme rounded-lg px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
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

                    <label className="mt-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-theme rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
                      {uploadingDoc ? (
                        <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-muted" />
                      )}
                      <span className="text-sm text-muted">{uploadingDoc ? 'Uploading...' : 'Add Document'}</span>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploadingDoc} />
                    </label>

                    {pharmacyData.documentUrls.length === 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>At least one document is required for verification</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || uploadingDoc}
                  className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all shadow-md ${
                    isPharmacy
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:shadow-emerald-600/40'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 hover:shadow-blue-600/40'
                  }`}
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : isPharmacy ? (
                    'Register & Submit Verification'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>

            {/* Card Footer */}
            <div className="bg-surface2/50 px-8 py-5 border-t border-theme text-center">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-blue-500 hover:text-blue-400">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
