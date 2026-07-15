import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Pill, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);

      const from = location.state?.from?.pathname || '/';
      let redirectPath = from;

      if (from === '/') {
        const role = response.user.role;
        if (role === 'DONOR')     redirectPath = '/donor/dashboard';
        else if (role === 'RECIPIENT') redirectPath = '/recipient/dashboard';
        else if (role === 'PHARMACY')  redirectPath = '/pharmacy/dashboard';
        else if (role === 'ADMIN')     redirectPath = '/admin/dashboard';
      }

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-8 text-center">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <Pill className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
              <p className="mt-2 text-blue-200">Sign in to your MediCycle account</p>
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
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-muted">Password</label>
                    <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-400">
                      Forgot password?
                    </a>
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 accent-blue-500 rounded border-theme bg-surface2"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted">
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <><LogIn className="h-5 w-5" /> Sign In</>
                  )}
                </button>
              </form>
            </div>

            {/* Card Footer */}
            <div className="bg-surface2/50 px-8 py-5 border-t border-theme text-center">
              <p className="text-sm text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-blue-500 hover:text-blue-400">
                  Register now
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
