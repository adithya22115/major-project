import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import { getCurrentPosition, formatDistance } from '../utils/geo';
import { Mail, MapPin, Phone, Shield, Save, X, Loader2, Locate, Navigation, CheckCircle } from 'lucide-react';

const inputClass =
  'block w-full px-4 py-2.5 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

const labelClass = 'block text-sm font-medium text-muted mb-1.5';

const Profile = () => {
  const { user, updateUserLocation, updateLocation } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
      });
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateProfile(formData);
      setProfile(updated);
      setEditing(false);
      if (updateUserLocation) {
        updateUserLocation(updated.city, updated.state, updated.pincode);
      }
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const pos = await getCurrentPosition();
      const result = await updateLocation(pos.latitude, pos.longitude);
      setProfile(prev => ({ ...prev, city: result.city, state: result.state, pincode: result.pincode, latitude: result.latitude, longitude: result.longitude }));
      setSuccess('Location updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.code === 1) {
        setError('Location access denied. Please allow location access in your browser settings.');
      } else {
        setError('Failed to detect location. Please try again.');
      }
    } finally {
      setLocating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const displayName = profile?.name || user?.name;
  const displayRole = profile?.role || user?.role;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">My Profile</h1>
        <p className="text-muted mt-1">Manage your account information and preferences.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 p-4 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/40 p-4 rounded-xl">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-10 text-white text-center sm:text-left sm:flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center mx-auto sm:mx-0 backdrop-blur-sm shadow-inner">
            <span className="text-4xl font-bold">{displayName?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="mt-4 sm:mt-0">
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 opacity-90 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full font-medium">{displayRole}</span>
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Account Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 sm:p-8">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Personal Information</h3>
                </div>
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input name="name" type="text" required className={inputClass} value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input name="phone" type="text" className={inputClass} value={formData.phone} onChange={handleChange} placeholder="Enter phone number" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-theme">
                <div className="md:col-span-2">
                  <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-3">Location</h3>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Street Address</label>
                  <input name="address" type="text" className={inputClass} value={formData.address} onChange={handleChange} placeholder="Enter street address" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input name="city" type="text" className={inputClass} value={formData.city} onChange={handleChange} placeholder="Enter city" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>State</label>
                    <input name="state" type="text" className={inputClass} value={formData.state} onChange={handleChange} placeholder="State" />
                  </div>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <input name="pincode" type="text" className={inputClass} value={formData.pincode} onChange={handleChange} placeholder="Pincode" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg text-sm font-medium text-muted hover:bg-surface2 hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 border-b border-theme pb-2">
                  Contact Information
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">Email Address</p>
                      <p className="text-sm text-muted">{profile?.email || user?.email}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">Phone Number</p>
                      <p className="text-sm text-muted">{profile?.phone || 'Not provided'}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider mb-4 border-b border-theme pb-2">
                  Location
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary">Address</p>
                      <p className="text-sm text-muted">
                        {profile?.address || 'Not provided'}
                        {profile?.city && <>, {profile.city}</>}
                        {profile?.state && <>, {profile.state}</>}
                        {profile?.pincode && <> {profile.pincode}</>}
                      </p>
                      {profile?.latitude && profile?.longitude && (
                        <p className="text-xs text-muted mt-1">
                          {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </li>
                </ul>

                {/* Map embed */}
                {profile?.latitude && profile?.longitude && (
                  <div className="rounded-lg overflow-hidden border border-theme mt-3">
                    <iframe
                      title="Your Location"
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.01}%2C${profile.latitude - 0.01}%2C${profile.longitude + 0.01}%2C${profile.latitude + 0.01}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`}
                    />
                  </div>
                )}

                {/* Use My Location button */}
                <button
                  onClick={handleLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
                >
                  {locating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <Locate className="h-4 w-4" />
                      Use My Current Location
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {!editing && (
            <div className="mt-8 pt-6 border-t border-theme flex justify-end">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
