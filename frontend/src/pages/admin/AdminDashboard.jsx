import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { askAdminQuery, getDemandForecast, getOverview } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  Users, Pill, ShieldCheck, Activity, Package, FileText,
  MapPin, ChevronDown, ChevronUp, ArrowRight,
  AlertTriangle, Clock, CheckCircle, XCircle, User, Heart,
  Stethoscope, Building2, BadgeCheck, Search
} from 'lucide-react';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [cityFilter, setCityFilter] = useState('');
  const [expandedCity, setExpandedCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [donationStatusFilter, setDonationStatusFilter] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [adminQuery, setAdminQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const result = await getOverview(cityFilter || undefined);
        setData(result);
      } catch (_err) {
        toast.error('Failed to load admin overview');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [cityFilter]);

  const runAdminQuery = async (e) => {
    e.preventDefault();
    if (!adminQuery.trim()) return;
    setQueryLoading(true);
    setQueryError('');
    try {
      setQueryResult(await askAdminQuery(adminQuery));
    } catch (_err) {
      setQueryError(_err.response?.data?.message || 'The assistant is unavailable. Make sure the backend is running and try again.');
      toast.error('Could not run the admin query');
    } finally {
      setQueryLoading(false);
    }
  };

  const loadForecast = async () => {
    try {
      setForecast(await getDemandForecast(6, cityFilter || undefined));
    } catch (_err) {
      toast.error('Could not load demand forecast');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center text-muted py-12">No data available</div>;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'users', label: `Users (${data.totalUsers})`, icon: Users },
    { key: 'donations', label: `Donations (${data.totalDonations})`, icon: Package },
    { key: 'requests', label: `Requests (${data.totalRequests})`, icon: FileText },
    { key: 'medicines', label: `Medicines (${data.totalMedicines})`, icon: Pill },
    { key: 'cities', label: 'By City', icon: MapPin },
  ];

  const filteredUsers = (data.allUsers || []).filter(u => {
    const matchSearch = !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = !userRoleFilter || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredDonations = (data.allDonations || []).filter(d => {
    const matchSearch = !searchTerm || d.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) || d.donorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !donationStatusFilter || d.status === donationStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredRequests = (data.allRequests || []).filter(r => {
    const matchSearch = !searchTerm || r.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !requestStatusFilter || r.status === requestStatusFilter;
    return matchSearch && matchStatus;
  });

  const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="bg-surface border border-theme rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="text-2xl font-bold text-primary mt-1">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`bg-${color}-500/15 p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
      COMPLETED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Admin Control Center</h1>
          <p className="text-muted mt-1">Complete visibility into the entire platform.</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <form onSubmit={runAdminQuery} className="bg-surface border border-theme rounded-xl p-4 sm:p-5 min-w-0">
            <h2 className="font-semibold text-primary">Admin query assistant</h2>
            <p className="text-xs text-muted mt-1">Try: “show pending donations” or “show completed requests”.</p>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input value={adminQuery} onChange={e => setAdminQuery(e.target.value)} className="min-w-0 flex-1 rounded-lg bg-surface2 border border-theme text-primary p-2.5" placeholder="Ask about the current overview..." aria-label="Admin query" />
              <button type="submit" disabled={queryLoading || !adminQuery.trim()} className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {queryLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
            {queryError && <p className="text-xs text-red-400 mt-3" role="alert">{queryError}</p>}
            {queryResult && <div className="text-xs text-muted mt-3 space-y-2">
              <p>{queryResult.interpretation}</p>
              <p className="text-primary">{queryResult.donations?.length || 0} donations · {queryResult.requests?.length || 0} requests · {queryResult.medicines?.length || 0} medicines</p>
              {(queryResult.donations?.length > 0 || queryResult.requests?.length > 0 || queryResult.medicines?.length > 0) && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-theme bg-surface2/40 p-2 space-y-1">
                  {queryResult.donations?.slice(0, 5).map(item => <div key={`d-${item.id}`}>{item.medicineName} — donation ({item.status})</div>)}
                  {queryResult.requests?.slice(0, 5).map(item => <div key={`r-${item.id}`}>{item.medicineName} — request ({item.status})</div>)}
                  {queryResult.medicines?.slice(0, 5).map(item => <div key={`m-${item.id}`}>{item.medicineName} — medicine</div>)}
                </div>
              )}
            </div>}
          </form>
          <div className="bg-surface border border-theme rounded-xl p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between">
              <div><h2 className="font-semibold text-primary">Demand forecast</h2><p className="text-xs text-muted mt-1">Recent request history, projected one month ahead.</p></div>
              <button onClick={loadForecast} className="px-3 py-2 rounded-lg border border-blue-500 text-blue-400 text-sm">Load</button>
            </div>
            {forecast && <div className="mt-3 space-y-1 text-xs text-muted">{forecast.forecasts?.slice(0, 5).map(item => <div key={item.medicineId} className="flex justify-between"><span>{item.medicineName}</span><span className="text-primary">{item.projectedNextMonthDemand} projected</span></div>)}</div>}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary placeholder-subtle focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-theme overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard title="Total Users" value={data.totalUsers} icon={Users} color="blue" />
            <StatCard title="Donors" value={data.totalDonors} icon={Heart} color="rose" sub={`${data.totalDonors} active donors`} />
            <StatCard title="Recipients" value={data.totalRecipients} icon={User} color="cyan" />
            <StatCard title="Pharmacies" value={data.totalPharmacies} icon={Building2} color="purple" sub={`${data.verifiedPharmacies} verified`} />
            <StatCard title="Medicines" value={data.totalMedicines} icon={Pill} color="emerald" />
            <StatCard title="Prescriptions" value={data.totalPrescriptions} icon={Stethoscope} color="amber" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard title="Pending Donations" value={data.pendingDonations} icon={Clock} color="amber" />
            <StatCard title="Approved Donations" value={data.approvedDonations} icon={CheckCircle} color="emerald" />
            <StatCard title="Rejected Donations" value={data.rejectedDonations} icon={XCircle} color="red" />
            <StatCard title="Pending Requests" value={data.pendingRequests} icon={Clock} color="amber" />
            <StatCard title="Completed Requests" value={data.completedRequests} icon={CheckCircle} color="green" />
            <StatCard title="Total Qty Donated" value={data.totalDonationQuantity} icon={Package} color="blue" />
          </div>

          {data.pendingDonations > 0 || data.pendingRequests > 0 ? (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-400">Needs Attention</h3>
                  <ul className="mt-1 text-sm text-amber-300/80 list-disc list-inside space-y-1">
                    {data.pendingDonations > 0 && <li>{data.pendingDonations} donation(s) pending verification</li>}
                    {data.pendingRequests > 0 && <li>{data.pendingRequests} medicine request(s) pending approval</li>}
                    {data.unverifiedPharmacies > 0 && <li>{data.unverifiedPharmacies} pharmacy awaiting verification</li>}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-theme p-6">
              <h3 className="text-sm font-semibold text-primary mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { to: '/admin/verifications', icon: ShieldCheck, label: 'Pharmacy Verifications', desc: 'Review pending pharmacy applications', color: 'blue' },
                  { to: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View, verify, or suspend users', color: 'purple' },
                  { to: '/admin/medicines', icon: Pill, label: 'Medicine Directory', desc: 'Manage medicine catalog', color: 'emerald' },
                ].map(({ to, icon: Icon, label, desc, color }) => (
                  <Link key={to} to={to} className={`flex items-center justify-between p-3 rounded-xl border border-theme hover:border-${color}-500/40 hover:bg-${color}-500/5 transition-colors group`}>
                    <div className="flex items-center gap-3">
                      <div className={`bg-${color}-500/15 p-2 rounded-lg`}>
                        <Icon className={`h-4 w-4 text-${color}-400`} />
                      </div>
                      <div>
                        <p className="font-medium text-primary text-sm">{label}</p>
                        <p className="text-xs text-muted">{desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-subtle group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-xl border border-theme overflow-hidden">
              <div className="px-5 py-4 border-b border-theme">
                <h3 className="text-sm font-semibold text-primary">Recent Activity</h3>
              </div>
              <ul className="divide-y divide-theme max-h-72 overflow-y-auto">
                {data.recentAuditLogs?.length > 0 ? data.recentAuditLogs.slice(0, 10).map(log => (
                  <li key={log.id} className="px-5 py-3 hover:bg-surface2/40">
                    <p className="text-sm font-medium text-primary">{log.action}</p>
                    <p className="text-xs text-muted">{log.entityName}{log.entityId ? ` #${log.entityId}` : ''} {log.userName ? `by ${log.userName}` : ''}</p>
                    <p className="text-xs text-subtle mt-0.5">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</p>
                  </li>
                )) : <li className="p-6 text-center text-sm text-muted">No recent activity</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary"
              />
            </div>
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary">
              <option value="">All Roles</option>
              <option value="DONOR">Donors</option>
              <option value="RECIPIENT">Recipients</option>
              <option value="PHARMACY">Pharmacies</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          <div className="bg-surface border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface2/50">
                    <th className="text-left px-5 py-3 font-medium text-muted">User</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Role</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">City</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Phone</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-surface2/30">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-primary">{u.name}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === 'ADMIN' ? 'bg-red-500/15 text-red-400' :
                          u.role === 'PHARMACY' ? 'bg-purple-500/15 text-purple-400' :
                          u.role === 'DONOR' ? 'bg-rose-500/15 text-rose-400' :
                          'bg-cyan-500/15 text-cyan-400'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3 text-primary">{u.city || '—'}{u.state ? `, ${u.state}` : ''}</td>
                      <td className="px-5 py-3 text-muted">{u.phone || '—'}</td>
                      <td className="px-5 py-3">
                        {u.isVerified ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>
                        ) : (
                          <span className="text-amber-400 text-xs">Unverified</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && <p className="p-8 text-center text-sm text-muted">No users match your filters</p>}
          </div>
        </div>
      )}

      {/* DONATIONS TAB */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input type="text" placeholder="Search by medicine or donor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary" />
            </div>
            <select value={donationStatusFilter} onChange={(e) => setDonationStatusFilter(e.target.value)} className="px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-surface border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface2/50">
                    <th className="text-left px-5 py-3 font-medium text-muted">Medicine</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Donor</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Qty</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">City</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Condition</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Expiry</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {filteredDonations.map(d => (
                    <tr key={d.id} className="hover:bg-surface2/30">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium text-primary">{d.medicineName}</p>
                          <p className="text-xs text-muted">{d.medicineCategory || '—'} • {d.medicineDosage || '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-primary">{d.donorName}</td>
                      <td className="px-5 py-3 text-primary font-medium">{d.quantity}</td>
                      <td className="px-5 py-3 text-primary">{d.city || '—'}</td>
                      <td className="px-5 py-3 text-muted">{d.condition || '—'}</td>
                      <td className="px-5 py-3 text-xs text-muted">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                      <td className="px-5 py-3 text-xs text-muted">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredDonations.length === 0 && <p className="p-8 text-center text-sm text-muted">No donations match your filters</p>}
          </div>
        </div>
      )}

      {/* REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input type="text" placeholder="Search by medicine or recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary" />
            </div>
            <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)} className="px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-surface border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface2/50">
                    <th className="text-left px-5 py-3 font-medium text-muted">Medicine</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Recipient</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Qty</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Prescription</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Approved By</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-surface2/30">
                      <td className="px-5 py-3 font-medium text-primary">{r.medicineName}</td>
                      <td className="px-5 py-3 text-primary">{r.recipientName}</td>
                      <td className="px-5 py-3 text-primary font-medium">{r.requestedQuantity}</td>
                      <td className="px-5 py-3">
                        {r.prescriptionId ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs"><FileText className="w-3.5 h-3.5" /> #{r.prescriptionId}</span>
                        ) : (
                          <span className="text-muted text-xs">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted text-xs">{r.approvedByName || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3 text-xs text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRequests.length === 0 && <p className="p-8 text-center text-sm text-muted">No requests match your filters</p>}
          </div>
        </div>
      )}

      {/* MEDICINES TAB */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" placeholder="Search medicines..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-surface2 border border-theme rounded-lg text-sm text-primary" />
          </div>
          <div className="bg-surface border border-theme rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme bg-surface2/50">
                    <th className="text-left px-5 py-3 font-medium text-muted">ID</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Manufacturer</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Category</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Dosage</th>
                    <th className="text-left px-5 py-3 font-medium text-muted">Rx Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {(data.allMedicines || []).filter(m => !searchTerm || m.medicineName?.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                    <tr key={m.id} className="hover:bg-surface2/30">
                      <td className="px-5 py-3 text-muted">#{m.id}</td>
                      <td className="px-5 py-3 font-medium text-primary">{m.medicineName}</td>
                      <td className="px-5 py-3 text-muted">{m.manufacturer || '—'}</td>
                      <td className="px-5 py-3 text-muted">{m.category || '—'}</td>
                      <td className="px-5 py-3 text-muted">{m.dosage || '—'}</td>
                      <td className="px-5 py-3">{m.requiresPrescription ? <CheckCircle className="w-4 h-4 text-amber-400" /> : <XCircle className="w-4 h-4 text-muted/30" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.allMedicines?.length === 0 && <p className="p-8 text-center text-sm text-muted">No medicines in system</p>}
          </div>
        </div>
      )}

      {/* CITIES TAB */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          {data.cityStats?.length === 0 ? (
            <div className="bg-surface border border-theme rounded-xl p-12 text-center">
              <MapPin className="w-12 h-12 text-muted/30 mx-auto mb-3" />
              <p className="text-muted font-medium">No city data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.cityStats?.map((city, idx) => (
                <div key={idx} className="bg-surface border border-theme rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCity(expandedCity === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-surface2/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/15 p-2.5 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{city.city}</p>
                        {city.state && <p className="text-xs text-muted">{city.state}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-bold text-primary">{city.donationCount}</p>
                        <p className="text-xs text-muted">donations</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{city.userCount}</p>
                        <p className="text-xs text-muted">users</p>
                      </div>
                      {expandedCity === idx ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                    </div>
                  </button>

                  {expandedCity === idx && (
                    <div className="px-5 pb-5 border-t border-theme pt-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-surface2 rounded-lg p-3">
                          <p className="text-lg font-bold text-primary">{city.totalQuantity}</p>
                          <p className="text-xs text-muted">Total Qty</p>
                        </div>
                        <div className="bg-surface2 rounded-lg p-3">
                          <p className="text-lg font-bold text-primary">{city.requestCount}</p>
                          <p className="text-xs text-muted">Requests</p>
                        </div>
                        <div className="bg-surface2 rounded-lg p-3">
                          <p className="text-lg font-bold text-primary">{city.pharmacyCount}</p>
                          <p className="text-xs text-muted">Pharmacies</p>
                        </div>
                      </div>

                      {city.medicines && city.medicines.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Medicines in this city</p>
                          <div className="space-y-2">
                            {city.medicines.map((med, mi) => (
                              <div key={mi} className="flex items-center justify-between bg-surface2 rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Pill className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-primary font-medium">{med.medicineName}</span>
                                  <span className="text-xs text-muted">{med.category || ''}</span>
                                </div>
                                <span className="text-xs text-muted">{med.availableQuantity} qty, {med.donationCount} donation{med.donationCount > 1 ? 's' : ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
