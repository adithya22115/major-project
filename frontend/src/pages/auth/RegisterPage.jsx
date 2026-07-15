import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { Heart, Package, Store, UserPlus } from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    roleId: '1', address: '', city: '', state: '', pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await register(formData);
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
      setError(
        err.response?.data?.message ||
        err.response?.data?.email ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { id: '1', label: 'Donor',     description: 'Donate medicines',    icon: Heart },
    { id: '2', label: 'Recipient', description: 'Request medicines',    icon: Package },
    { id: '3', label: 'Pharmacy',  description: 'Verify & dispense',   icon: Store },
  ];

  return (
    <div className="min-h-screen bg-page flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <div className="bg-surface rounded-2xl shadow-xl border border-theme overflow-hidden">

            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-8 text-center">
              <div className="mx-auto bg-white/20 h-16 w-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Create an Account</h2>
              <p className="mt-2 text-blue-200">Join MediCycle and start making a difference</p>
            </div>

            {/* Card Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <form className="space-y-7" onSubmit={handleSubmit}>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3 text-center">
                    How would you like to use MediCycle?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roleOptions.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => setFormData({ ...formData, roleId: role.id })}
                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${
                          formData.roleId === role.id
                            ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20'
                            : 'border-theme hover:border-blue-500/40 hover:bg-surface2'
                        }`}
                      >
                        <role.icon className={`h-8 w-8 mb-2 ${formData.roleId === role.id ? 'text-blue-400' : 'text-muted'}`} />
                        <span className={`font-semibold ${formData.roleId === role.id ? 'text-blue-400' : 'text-primary'}`}>
                          {role.label}
                        </span>
                        <span className="text-xs text-subtle mt-1">{role.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-theme">
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Account Information</h3>
                  </div>

                  <div>
                    <label className={labelClass}>Full Name (or Organization)</label>
                    <input name="name" type="text" required className={inputClass} value={formData.name} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input name="email" type="email" required className={inputClass} value={formData.email} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Password</label>
                    <input name="password" type="password" required className={inputClass} value={formData.password} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input name="phone" type="text" className={inputClass} value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                {/* Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-theme">
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Location Details</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Street Address</label>
                    <input name="address" type="text" className={inputClass} value={formData.address} onChange={handleChange} />
                  </div>

                  <div>
                    <label className={labelClass}>City</label>
                    <input name="city" type="text" className={inputClass} value={formData.city} onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
                >
                  {loading ? (
                    <span className="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
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
