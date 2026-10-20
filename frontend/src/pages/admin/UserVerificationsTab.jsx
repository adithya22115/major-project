import React, { useEffect, useState } from 'react';
import {
  CheckCircle, Clock, ShieldCheck, XCircle, Building2, Stethoscope,
  User, ArrowRight, Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUsers, updateUserStatus } from '../../services/adminService';
import { getPendingPharmacyVerifications } from '../../services/pharmacyVerificationService';
import { getPendingDoctorVerifications } from '../../services/doctorVerificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserVerificationsTab = ({ onSwitchWorkflow }) => {
  const [regularUsers, setRegularUsers] = useState([]);
  const [pendingPharmaciesCount, setPendingPharmaciesCount] = useState(0);
  const [pendingDoctorsCount, setPendingDoctorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, pendingPharmacies, pendingDoctors] = await Promise.all([
        getUsers(),
        getPendingPharmacyVerifications().catch(() => []),
        getPendingDoctorVerifications().catch(() => []),
      ]);

      const usersList = allUsers || [];

      // Filter out professional accounts: pharmacies and doctors have their own dedicated sections
      const pendingRegular = usersList.filter(
        u => !u.isVerified && u.role !== 'PHARMACY' && u.role !== 'DOCTOR'
      );
      setRegularUsers(pendingRegular);

      // Count unverified pharmacies (both from verification table and user list)
      const unverifiedPharmacies = usersList.filter(u => !u.isVerified && u.role === 'PHARMACY');
      const pharmacyIds = new Set((pendingPharmacies || []).map(p => p.userId));
      unverifiedPharmacies.forEach(u => pharmacyIds.add(u.id));
      setPendingPharmaciesCount(Math.max((pendingPharmacies || []).length, pharmacyIds.size));

      // Count unverified doctors (both from verification table and user list)
      const unverifiedDoctors = usersList.filter(u => !u.isVerified && u.role === 'DOCTOR');
      const doctorIds = new Set((pendingDoctors || []).map(d => d.userId));
      unverifiedDoctors.forEach(u => doctorIds.add(u.id));
      setPendingDoctorsCount(Math.max((pendingDoctors || []).length, doctorIds.size));
    } catch {
      toast.error('Failed to load user verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const changeStatus = async (user, isVerified) => {
    setActionLoading(user.id);
    try {
      const approvalRemarks = isVerified
        ? 'Your account has been verified and approved by an administrator. You now have full access to MediCycle.'
        : 'Application rejected by administrator.';
      await updateUserStatus(user.id, { isVerified, remarks: approvalRemarks });
      setRegularUsers(previous => previous.filter(item => item.id !== user.id));
      toast.success(isVerified ? `User ${user.name} approved successfully` : `User ${user.name} rejected`);
    } catch {
      toast.error('Failed to update user verification');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const finalRemarks = rejectRemarks.trim() || 'Application rejected by administrator.';
    setActionLoading(rejectModal.id);
    try {
      await updateUserStatus(rejectModal.id, { isVerified: false, remarks: finalRemarks });
      setRegularUsers(previous => previous.filter(item => item.id !== rejectModal.id));
      toast.success(`User ${rejectModal.name} rejected successfully`);
      setRejectModal(null);
      setRejectRemarks('');
    } catch {
      toast.error('Failed to reject user verification');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Informational banners directing professional verifications to their dedicated sections */}
      {(pendingPharmaciesCount > 0 || pendingDoctorsCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingPharmaciesCount > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400">
                    {pendingPharmaciesCount} Pharmacy Verification{pendingPharmaciesCount > 1 ? 's' : ''} Pending
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    Drug licenses and store documents are reviewed in the Pharmacy Verifications section.
                  </p>
                </div>
              </div>
              {onSwitchWorkflow && (
                <button
                  type="button"
                  onClick={() => onSwitchWorkflow('PHARMACY')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-sm"
                >
                  Go to Pharmacies <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {pendingDoctorsCount > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-400">
                    {pendingDoctorsCount} Doctor Verification{pendingDoctorsCount > 1 ? 's' : ''} Pending
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    Medical council registrations and degree certificates are reviewed in the Doctor Verifications section.
                  </p>
                </div>
              </div>
              {onSwitchWorkflow && (
                <button
                  type="button"
                  onClick={() => onSwitchWorkflow('DOCTOR')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shadow-sm"
                >
                  Go to Doctors <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main General Users Section */}
      <section className="bg-surface border border-theme rounded-2xl overflow-hidden shadow-sm" aria-labelledby="user-verifications-heading">
        <div className="p-5 border-b border-theme flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 id="user-verifications-heading" className="text-xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> General User Verifications
            </h2>
            <p className="text-sm text-muted mt-1">
              Review and approve registered donors and recipients before they access platform services.
            </p>
          </div>
          <span className="bg-surface2 px-3 py-1 rounded-full text-xs font-semibold text-primary border border-theme self-start">
            {regularUsers.length} Pending
          </span>
        </div>

        {regularUsers.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-primary font-semibold">No pending general user verifications.</p>
            <p className="text-sm text-muted mt-1">
              All donors and recipients are currently verified and active.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {regularUsers.map(user => {
              const isDonor = user.role === 'DONOR';
              const isRecipient = user.role === 'RECIPIENT';

              return (
                <div key={user.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-surface2/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 ${
                      isDonor
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : isRecipient
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {isDonor ? <Heart className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-primary text-base">{user.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isDonor
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : isRecipient
                            ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted mt-0.5">
                        {user.email} {user.phone ? `• ${user.phone}` : ''}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Registered on {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                        {user.city && (
                          <span>• {user.city}{user.state ? `, ${user.state}` : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => changeStatus(user, true)}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-60 cursor-pointer"
                    >
                      {actionLoading === user.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectModal(user);
                        setRejectRemarks('');
                      }}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reject Confirmation Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-theme rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-primary">
              Reject {rejectModal.role} Application
            </h3>
            <p className="text-sm text-muted">
              Are you sure you want to reject the application of{' '}
              <span className="font-semibold text-primary">{rejectModal.name}</span>? An official notification will be sent to their email ({rejectModal.email}).
            </p>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full px-4 py-3 bg-surface2 border border-theme rounded-xl text-primary text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none outline-none"
              rows={3}
              placeholder="Reason for rejection (e.g. Incomplete profile details or unverified contact)..."
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModal(null);
                  setRejectRemarks('');
                }}
                className="px-4 py-2 text-sm text-muted hover:text-primary border border-theme rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading === rejectModal.id}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-60 cursor-pointer"
              >
                {actionLoading === rejectModal.id ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerificationsTab;
