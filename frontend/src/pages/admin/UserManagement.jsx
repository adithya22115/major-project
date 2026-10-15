import React, { useState, useEffect } from 'react';
import { getUsers } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';
import { Users, CheckCircle, XCircle } from 'lucide-react';

const roleBadge = {
  DONOR:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  RECIPIENT: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PHARMACY:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
  ADMIN:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
};
const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user.verified) return false;
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole   = roleFilter ? user.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const totalPages    = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers  = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">User Management</h2>
        <p className="text-muted mt-1">Manage user accounts. Donors and recipients are auto-verified. Pharmacies require document verification.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        {/* Toolbar */}
        <div className="px-0 py-4 border-b border-theme flex flex-col sm:flex-row gap-3 bg-surface2/30">
          <div className="flex-1 max-w-md w-full">
            <SearchBar
              value={searchTerm}
              onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
              placeholder="Search by name or email..."
            />
          </div>
          <div className="sm:w-44">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="block w-full h-[38px] py-2 px-3 border border-theme rounded-lg text-sm bg-surface2 text-primary focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="DONOR">Donor</option>
              <option value="RECIPIENT">Recipient</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No users found"
              description="No users match your current search and filter criteria."
              icon={Users}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">User Details</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {currentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-primary">{u.name}</div>
                          <div className="text-subtle text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${roleBadge[u.role] || 'bg-surface2 text-muted border-theme'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.verified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                          <CheckCircle className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                          <XCircle className="h-4 w-4" /> Suspended
                        </span>
                      )}
                      {u.role === 'PHARMACY' && (
                        <span className="block text-xs text-muted mt-1">Managed via verifications</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-subtle">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>
    </div>
  );
};

export default UserManagement;
