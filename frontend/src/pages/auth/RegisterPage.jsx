import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import {
  Building2, Stethoscope, ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> Professional & Partner Registration
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Join the MediCycle Healthcare Network
            </h1>
            <p className="text-muted text-base max-w-xl mx-auto">
              Choose your professional role to start the dedicated onboarding and verification workflow.
            </p>
          </div>

          {/* Cards Grid: Pharmacy vs Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pharmacy Portal Card */}
            <div className="bg-surface border border-theme hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col justify-between shadow-lg transition-all duration-200 group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Retail & Hospital
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-primary group-hover:text-emerald-400 transition-colors">
                    Pharmacy / Pharmacist
                  </h2>
                  <p className="text-muted text-sm mt-2 leading-relaxed">
                    Register your licensed pharmacy to inspect donated medicines, verify packaging and expiry dates, and manage surplus inventory safely.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-theme">
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Drug License verification workflow</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Pending donation QA & approval</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Inventory stock & redispatch tracking</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-theme">
                <Link
                  to="/pharmacy-register"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 group-hover:shadow-emerald-600/40"
                >
                  Register Pharmacy
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Doctor Portal Card */}
            <div className="bg-surface border border-theme hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col justify-between shadow-lg transition-all duration-200 group">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Medical Specialist
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-primary group-hover:text-indigo-400 transition-colors">
                    Doctor / Practitioner
                  </h2>
                  <p className="text-muted text-sm mt-2 leading-relaxed">
                    Join as a registered medical doctor to conduct patient consultations, review essential medicine requirements, and assist community health.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-theme">
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Medical Council registration verification</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Direct patient consultation requests</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>WhatsApp telemedicine connect</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-theme">
                <Link
                  to="/doctor-register"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 group-hover:shadow-indigo-600/40"
                >
                  Register Doctor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="text-center pt-2">
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
  );
};

export default RegisterPage;
