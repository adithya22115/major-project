import React, { useState, useEffect } from 'react';
import { Building2, Stethoscope, ShieldCheck } from 'lucide-react';
import PharmacyVerificationsTab from './PharmacyVerificationsTab';
import DoctorVerificationsTab from './DoctorVerificationsTab';
import UserVerificationsTab from './UserVerificationsTab';
import { getPendingPharmacyVerifications } from '../../services/pharmacyVerificationService';
import { getPendingDoctorVerifications } from '../../services/doctorVerificationService';
import { getUsers } from '../../services/adminService';

const AdminVerifications = () => {
  const [activeWorkflow, setActiveWorkflow] = useState('PHARMACY'); // 'PHARMACY' | 'DOCTOR' | 'USER'
  const [counts, setCounts] = useState({ pharmacy: 0, user: 0, doctor: 0 });

  const loadCounts = async () => {
    try {
      const [allUsers, pendingPharmacies, pendingDoctors] = await Promise.all([
        getUsers().catch(() => []),
        getPendingPharmacyVerifications().catch(() => []),
        getPendingDoctorVerifications().catch(() => []),
      ]);

      const usersList = allUsers || [];

      // Regular users: unverified non-pharmacy, non-doctor
      const regularCount = usersList.filter(
        u => !u.isVerified && u.role !== 'PHARMACY' && u.role !== 'DOCTOR'
      ).length;

      // Pharmacy count: union of pending verifications and unverified pharmacy users
      const pIds = new Set((pendingPharmacies || []).map(p => p.userId));
      usersList.filter(u => !u.isVerified && u.role === 'PHARMACY').forEach(u => pIds.add(u.id));
      const pharmacyCount = Math.max((pendingPharmacies || []).length, pIds.size);

      // Doctor count: union of pending verifications and unverified doctor users
      const dIds = new Set((pendingDoctors || []).map(d => d.userId));
      usersList.filter(u => !u.isVerified && u.role === 'DOCTOR').forEach(u => dIds.add(u.id));
      const doctorCount = Math.max((pendingDoctors || []).length, dIds.size);

      setCounts({
        pharmacy: pharmacyCount,
        user: regularCount,
        doctor: doctorCount,
      });
    } catch {
      // Silently ignore count load failures
    }
  };

  useEffect(() => {
    loadCounts();
  }, [activeWorkflow]);

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
            Dedicated review sections for pharmacy drug licenses, doctor credentials, and general user accounts.
          </p>
        </div>

        {/* Workflow Switcher: Pharmacy vs Doctor vs User */}
        <div className="inline-flex rounded-xl bg-surface2 p-1 border border-theme self-start shadow-sm">
          <button
            type="button"
            onClick={() => setActiveWorkflow('PHARMACY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeWorkflow === 'PHARMACY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Pharmacy Verifications
            {counts.pharmacy > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                activeWorkflow === 'PHARMACY' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {counts.pharmacy}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkflow('DOCTOR')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeWorkflow === 'DOCTOR'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Doctor Verifications
            {counts.doctor > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                activeWorkflow === 'DOCTOR' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                {counts.doctor}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveWorkflow('USER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeWorkflow === 'USER' ? 'bg-blue-600 text-white shadow-sm' : 'text-muted hover:text-primary hover:bg-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            User Verifications
            {counts.user > 0 && (
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                activeWorkflow === 'USER' ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {counts.user}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Render Selected Workflow Tab */}
      {activeWorkflow === 'PHARMACY' ? (
        <PharmacyVerificationsTab />
      ) : activeWorkflow === 'DOCTOR' ? (
        <DoctorVerificationsTab />
      ) : (
        <UserVerificationsTab onSwitchWorkflow={setActiveWorkflow} />
      )}
    </div>
  );
};

export default AdminVerifications;
