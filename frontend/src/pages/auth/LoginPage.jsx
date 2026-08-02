import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { LogIn, ShieldCheck, Building2, Loader2, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('admin');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || user?.isGuest) return;

    let redirectPath = '/';
    const from = location.state?.from?.pathname;
    if (from && from !== '/') {
      redirectPath = from;
    } else {
      switch (user.role) {
        case 'ADMIN': redirectPath = '/admin/dashboard'; break;
        case 'PHARMACY': redirectPath = user.verified ? '/pharmacy/dashboard' : '/pharmacy/verification'; break;
        default: redirectPath = '/';
      }
    }
    navigate(redirectPath, { replace: true });
  }, [user, navigate, location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password, rememberMe);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = activeTab === 'admin';

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">
            {/* Card Header */}
            <div className={`px-6 py-8 text-center transition-colors duration-300 ${
              isAdmin
                ? 'bg-gradient-to-r from-slate-700 to-slate-800'
                : 'bg-gradient-to-r from-emerald-700 to-teal-800'
            }`}>
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                {isAdmin
                  ? <ShieldCheck className="h-8 w-8 text-white" />
                  : <Building2 className="h-8 w-8 text-white" />
                }
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {isAdmin ? 'Admin Portal' : 'Pharmacist Portal'}
              </h2>
              <p className="mt-2 text-white/70">
                {isAdmin ? 'Sign in to manage MediCycle' : 'Sign in to verify and manage donations'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-theme">
              <button
                onClick={() => { setActiveTab('admin'); setError(''); setFormData({ email: '', password: '' }); }}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  isAdmin
                    ? 'text-slate-400 border-b-2 border-slate-400 bg-surface2/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <ShieldCheck className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Admin Login
              </button>
              <button
                onClick={() => { setActiveTab('pharmacy'); setError(''); setFormData({ email: '', password: '' }); }}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                  !isAdmin
                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-surface2/30'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Pharmacist Login
              </button>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={isAdmin ? "admin@medicycle.com" : "pharmacy@example.com"}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-muted">Password</label>
                    <Link to="/forgot-password" className="text-sm font-medium text-blue-500 hover:text-blue-400">
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary hover:text-blue-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 accent-blue-500 rounded border-theme bg-surface2"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md ${
                    isAdmin
                      ? 'bg-slate-600 hover:bg-slate-500 shadow-slate-600/20 hover:shadow-slate-600/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:shadow-emerald-600/40'
                  } disabled:opacity-60`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <><LogIn className="h-5 w-5" /> Sign In</>
                  )}
                </button>
              </form>
            </div>

            {/* Footer hint */}
            <div className="bg-surface2/50 px-8 py-5 border-t border-theme text-center space-y-2">
              {!isAdmin && (
                <p className="text-sm text-muted">
                  New Pharmacist?{' '}
                  <Link to="/register" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Register your pharmacy
                  </Link>
                </p>
              )}
              <p className="text-sm text-muted">
                Donor or Patient?{' '}
                <Link to="/" className="font-semibold text-blue-500 hover:text-blue-400">
                  Go to Homepage
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
