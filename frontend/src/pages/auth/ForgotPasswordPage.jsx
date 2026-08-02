import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { KeyRound, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-8 text-center">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <KeyRound className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Forgot Password?</h2>
              <p className="mt-2 text-white/70">No worries, we'll send you a reset link</p>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {sent ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto bg-green-500/10 h-16 w-16 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary">Check your email</h3>
                  <p className="text-sm text-muted">
                    If an account exists with <span className="font-medium text-primary">{email}</span>,
                    we've sent a password reset link.
                  </p>
                  <p className="text-xs text-subtle">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <div className="pt-4 space-y-3">
                    <button
                      onClick={() => { setSent(false); setEmail(''); }}
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-md shadow-amber-600/20"
                    >
                      Try another email
                    </button>
                    <Link
                      to="/login"
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-muted bg-surface2 hover:bg-surface2/80 border border-theme transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-subtle" />
                        </div>
                        <input
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                          placeholder="Enter your registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <p className="mt-2 text-xs text-subtle">
                        We'll send a password reset link to this email address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-60 transition-all shadow-md shadow-amber-600/20 hover:shadow-amber-600/40"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>Send Reset Link</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Card Footer */}
            <div className="bg-surface2/50 px-8 py-5 border-t border-theme text-center">
              <p className="text-sm text-muted">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-amber-500 hover:text-amber-400">
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

export default ForgotPasswordPage;
