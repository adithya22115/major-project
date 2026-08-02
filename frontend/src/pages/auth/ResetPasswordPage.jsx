import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { KeyRound, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: formData.newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-page flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden text-center p-8">
              <div className="mx-auto bg-red-500/10 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Invalid Link</h2>
              <p className="text-muted mb-6">
                This password reset link is invalid or missing a token.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
              >
                Request a new link
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

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-center">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Reset Password</h2>
              <p className="mt-2 text-white/70">Enter your new password below</p>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {success ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto bg-green-500/10 h-16 w-16 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary">Password Reset Successful</h3>
                  <p className="text-sm text-muted">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-muted mb-1.5">New Password</label>
                      <input
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10"
                        placeholder="Enter new password"
                        value={formData.newPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-emerald-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-muted mb-1.5">Confirm New Password</label>
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10"
                        placeholder="Re-enter new password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-emerald-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="bg-surface2/50 border border-theme rounded-xl p-4">
                      <p className="text-xs font-medium text-muted mb-2">Password must contain:</p>
                      <ul className="text-xs text-subtle space-y-1">
                        <li className={formData.newPassword.length >= 8 ? 'text-green-400' : ''}>
                          {formData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                          {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                          {/[a-z]/.test(formData.newPassword) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                          {/[0-9]/.test(formData.newPassword) ? '✓' : '○'} One number
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-400' : ''}>
                          {/[^A-Za-z0-9]/.test(formData.newPassword) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/40"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>Reset Password</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Card Footer */}
            <div className="bg-surface2/50 px-8 py-5 border-t border-theme text-center">
              <p className="text-sm text-muted">
                <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-400 inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
