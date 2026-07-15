import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Heart, ShieldCheck, Package, Users, ArrowRight, Building2, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-page">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-b from-blue-950/40 to-transparent dark:from-blue-950/60">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
              Reduce Medicine Waste.<br />
              <span className="text-blue-500">Help Someone in Need.</span>
            </h1>
            <p className="mt-4 text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              MediCycle connects medicine donors with verified pharmacies and patients in need.
              Every donation is verified for safety before redistribution.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Donate Medicine <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="bg-surface hover:bg-surface2 text-blue-500 border-2 border-blue-500/60 hover:border-blue-400 font-semibold px-8 py-4 rounded-xl text-lg transition-all flex items-center justify-center"
              >
                Find Medicines
              </Link>
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
          <p className="text-sm font-semibold text-subtle uppercase tracking-widest mb-8">
            Trusted by Partner Pharmacies & NGOs
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale">
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
          <Link
            to="/register"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
