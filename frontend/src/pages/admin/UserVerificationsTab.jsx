import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUsers, updateUserStatus } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserVerificationsTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getUsers();
      setUsers((allUsers || []).filter(user => !user.isVerified));
    } catch {
      toast.error('Failed to load user verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPendingUsers(); }, []);

  const changeStatus = async (user, isVerified) => {
    try {
      await updateUserStatus(user.id, { isVerified });
      setUsers(previous => previous.filter(item => item.id !== user.id));
      toast.success(isVerified ? 'User approved' : 'User rejected');
    } catch {
      toast.error('Failed to update user verification');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <section className="bg-surface border border-theme rounded-xl overflow-hidden" aria-labelledby="user-verifications-heading">
      <div className="p-5 border-b border-theme">
        <h2 id="user-verifications-heading" className="text-xl font-bold text-primary flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" /> User Verifications
        </h2>
        <p className="text-sm text-muted mt-1">Approve or reject accounts before they appear in active users.</p>
      </div>
      {users.length === 0 ? (
        <div className="p-10 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-muted">No pending user verifications.</p>
        </div>
      ) : (
        <div className="divide-y divide-theme">
          {users.map(user => (
            <div key={user.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-primary">{user.name}</p>
                <p className="text-sm text-muted">{user.email} · {user.role}</p>
                <p className="text-xs text-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending verification</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => changeStatus(user, true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button type="button" onClick={() => changeStatus(user, false)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default UserVerificationsTab;
