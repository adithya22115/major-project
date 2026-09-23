import React, { useState } from 'react';
import { Building2, Stethoscope, ShieldCheck } from 'lucide-react';
import PharmacyVerificationsTab from './PharmacyVerificationsTab';
import DoctorVerificationsTab from './DoctorVerificationsTab';
import UserVerificationsTab from './UserVerificationsTab';

const AdminVerifications = () => {
  const [activeWorkflow, setActiveWorkflow] = useState('PHARMACY'); // 'PHARMACY' | 'DOCTOR' | 'USER'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-theme">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-primary">Partner & Professional Verification Center</h1>
          </div>
          <p className="text-muted text-sm mt-1">
            Manage separate workflows for pharmacy licensing and doctor credential verifications.
          </p>
        </div>

        {/* Workflow Switcher: Pharmacy vs Doctor */}
        <div className="inline-flex rounded-xl bg-surface2 p-1 border border-theme self-start shadow-sm">
          <button
            onClick={() => setActiveWorkflow('PHARMACY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeWorkflow === 'PHARMACY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Pharmacy Verifications
          </button>
          <button
            onClick={() => setActiveWorkflow('USER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeWorkflow === 'USER' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            User Verifications
          </button>
          <button
            onClick={() => setActiveWorkflow('DOCTOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeWorkflow === 'DOCTOR'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Doctor Verifications
          </button>
        </div>
      </div>

      {/* Render Selected Workflow Tab */}
      {activeWorkflow === 'PHARMACY' ? (
        <PharmacyVerificationsTab />
      ) : activeWorkflow === 'DOCTOR' ? (
        <DoctorVerificationsTab />
      ) : (
        <UserVerificationsTab />
      )}
    </div>
  );
};

export default AdminVerifications;
