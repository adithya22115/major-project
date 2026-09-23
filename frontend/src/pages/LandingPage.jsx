import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Heart, ShieldCheck, Package, Users, ArrowRight, Building2, TrendingUp, MapPin, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import HealthAssistantWidget from '../components/common/HealthAssistantWidget';
import { getCurrentPosition } from '../utils/geo';

const GuestModal = ({ role, onClose, onSuccess }) => {
  const { guestRegister } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationCity, setLocationCity] = useState('');

  const isDonor = role === 'DONOR';

  const requestLocation = async () => {
    setLocationStatus('requesting');
    try {
      const pos = await getCurrentPosition();
      setLocationCoords(pos);
      setLocationStatus('granted');
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.latitude}&lon=${pos.longitude}&format=json`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      setLocationCity(city);
    } catch {
      setLocationStatus('denied');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await guestRegister(
        name.trim(),
        role,
        phone || undefined,
        undefined,
        locationCoords?.latitude || undefined,
        locationCoords?.longitude || undefined
      );
      setSuccess(true);
      setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface border border-theme rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={`px-6 py-6 text-center ${isDonor ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'bg-gradient-to-r from-emerald-700 to-teal-800'}`}>
          <div className="mx-auto bg-white/20 h-14 w-14 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm border border-white/30">
            {isDonor ? <Heart className="h-7 w-7 text-white" /> : <Package className="h-7 w-7 text-white" />}
          </div>
          <h3 className="text-xl font-bold text-white">
            {isDonor ? 'Donate Medicine' : 'Find Medicines'}
          </h3>
          <p className="text-sm text-white/70 mt-1">
            {isDonor
              ? 'Enter your details to start donating medicines'
              : 'Enter your details to browse available medicines'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-semibold text-primary">Welcome to MediCycle!</p>
              <p className="text-sm text-muted mt-1">Redirecting you now...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">
                  Phone Number <span className="text-subtle">(optional)</span>
                </label>
                <input
                  type="tel"
                  className="block w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Location Detection */}
              <div className="bg-surface2 border border-theme rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    Location Access
                  </label>
                  {locationStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={requestLocation}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                    >
                      Detect Location
                    </button>
                  )}
                  {locationStatus === 'requesting' && (
                    <span className="text-xs text-muted flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                    </span>
                  )}
                  {locationStatus === 'granted' && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3" /> Detected
                    </span>
                  )}
                  {locationStatus === 'denied' && (
                    <span className="text-xs text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Denied
                    </span>
                  )}
                </div>
                {locationStatus === 'granted' && locationCity && (
                  <p className="text-xs text-muted mt-1">
                    Your location: <span className="text-primary font-medium">{locationCity}</span>
                  </p>
                )}
                {locationStatus === 'denied' && (
                  <p className="text-xs text-amber-400/70 mt-1">
                    Location access denied. You can still use the app but nearest locations won't work.
                  </p>
                )}
                {locationStatus === 'idle' && (
                  <p className="text-xs text-muted mt-1">
                    Allow location access to find nearest donation centers.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 border border-theme rounded-xl text-sm font-medium text-muted hover:bg-surface2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 ${
                    isDonor
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isDonor ? <Heart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                      {isDonor ? 'Start Donating' : 'Find Medicines'}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [guestModal, setGuestModal] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const elem = document.getElementById(id);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash, location.pathname]);

  const handleGuestSuccess = (role) => {
    setGuestModal(null);
    if (role === 'DONOR') navigate('/donor/dashboard', { replace: true });
    else navigate('/recipient/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-page">
      <Navbar onOpenGuest={(role) => setGuestModal(role)} />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-b from-blue-950/5 dark:from-blue-950/60 to-transparent">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
                Reduce Medicine Waste.<br />
                <span className="text-blue-500">Help Someone in Need.</span>
              </h1>
              <p className="mt-4 text-xl text-muted mb-10 leading-relaxed">
                MediCycle connects medicine donors with verified pharmacies and patients in need.
                Every donation is verified for safety before redistribution.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <button
                  onClick={() => setGuestModal('DONOR')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Donate Medicine <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setGuestModal('RECIPIENT')}
                  className="bg-surface hover:bg-surface2 text-blue-500 border-2 border-blue-500/60 hover:border-blue-400 font-semibold px-8 py-4 rounded-xl text-lg transition-all flex items-center justify-center gap-2"
                >
                  Find Medicines <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="relative mt-12 lg:mt-0 lg:ml-10 group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <img 
                src="/assets/images/hero_pharmacist.png" 
                alt="Professional Pharmacist" 
                className="relative rounded-2xl shadow-2xl border border-theme object-cover w-full h-[500px] transform group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-10 mx-4 sm:mx-6 lg:mx-auto max-w-7xl -mt-16 relative z-20 rounded-2xl overflow-hidden bg-blue-600 shadow-2xl shadow-blue-900/40">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-60" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 py-4 relative z-10">
          {[
            { value: '1,000+', label: 'Medicines Donated' },
            { value: '500+',   label: 'Patients Helped' },
            { value: '50+',    label: 'Partner Pharmacies' },
            { value: '98%',    label: 'Verification Rate' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-bold text-white mb-1">{value}</p>
              <p className="text-blue-100 font-medium text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>



      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-blue-500 font-semibold tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
              How MediCycle Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Heart,
                bg: 'bg-blue-500/10',
                iconColor: 'text-blue-400',
                step: '1. Donate Medicine',
                desc: 'List your unused, unexpired medicines on the platform with details and photos.',
              },
              {
                icon: ShieldCheck,
                bg: 'bg-emerald-500/10',
                iconColor: 'text-emerald-400',
                step: '2. Verification Process',
                desc: 'Partner pharmacies review and verify the donated medicines for safety and quality.',
              },
              {
                icon: Package,
                bg: 'bg-amber-500/10',
                iconColor: 'text-amber-400',
                step: '3. Request Medicine',
                desc: 'Patients in need can browse the verified pool and request medicines for free.',
              },
            ].map(({ icon: Icon, bg, iconColor, step, desc }) => (
              <div key={step} className="text-center">
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${bg} border border-theme mb-6`}>
                  <Icon className={`h-10 w-10 ${iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">{step}</h3>
                <p className="text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Medicines Showcase */}
      <section className="py-24 bg-surface2/30 dark:bg-surface2/20 border-y border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-6">
                Safety is Our <span className="text-emerald-500">Top Priority</span>
              </h2>
              <p className="text-lg text-muted mb-8 leading-relaxed">
                We understand that handling medications requires the highest level of care. 
                Our platform enforces strict protocols to ensure every single pill distributed is safe and authentic.
              </p>
              
              <ul className="space-y-6">
                {[
                  'Certified Pharmacist Review for every donation',
                  'Strict Expiration Date Tracking & Enforcement',
                  'Sealed Packaging Verification requirements',
                  'Secure & Anonymous Patient Matching'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-primary font-medium">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 lg:order-2 relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <img 
                src="/assets/images/medicine_pills.png" 
                alt="Organized Medicines" 
                className="relative rounded-2xl shadow-xl border border-theme object-cover w-full h-[450px] transform group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="about" className="py-24 bg-surface2/30 dark:bg-surface2/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-emerald-500 font-semibold tracking-wide uppercase">Why Us</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
              Why Choose MediCycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                iconColor: 'text-blue-400',
                title: 'Reduce Medicine Waste',
                desc: 'Millions of dollars worth of usable medicines are discarded annually. Help us break this cycle.',
              },
              {
                icon: ShieldCheck,
                iconColor: 'text-emerald-400',
                title: 'Safe & Verified',
                desc: 'Every donation undergoes a strict verification process by registered pharmacists to ensure safety.',
              },
              {
                icon: Users,
                iconColor: 'text-amber-400',
                title: 'Community Impact',
                desc: 'Directly impact the lives of those who struggle to afford basic healthcare and prescription medications.',
              },
            ].map(({ icon: Icon, iconColor, title, desc }) => (
              <div
                key={title}
                className="bg-surface p-8 rounded-2xl shadow-sm border border-theme hover:shadow-md hover:border-blue-500/30 transition-all"
              >
                <Icon className={`h-8 w-8 ${iconColor} mb-4`} />
                <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
                <p className="text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-page border-y border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-subtle tracking-widest mb-8">
            Trusted by Partner Pharmacies & NGOs
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70">
            {['Apollo Pharmacy', 'MedPlus', 'Jan Aushadhi', 'Red Cross India'].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-muted" />
                <span className="text-xl font-bold text-primary">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-700 to-indigo-800 dark:from-blue-900 dark:to-indigo-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-200 mb-10">
            Join thousands of users who are already reducing waste and saving lives.
          </p>
          <button
            onClick={() => setGuestModal('DONOR')}
            className="inline-block bg-white text-blue-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Now
          </button>
        </div>
      </section>

      <Footer />

      {/* Guest Modal */}
      {guestModal && (
        <GuestModal
          role={guestModal}
          onClose={() => setGuestModal(null)}
          onSuccess={() => handleGuestSuccess(guestModal)}
        />
      )}

      {/* AI Health Assistant Floating Widget */}
      <HealthAssistantWidget />
    </div>
  );
};

export default LandingPage;
