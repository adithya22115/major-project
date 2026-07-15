import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMedicines } from '../../services/medicineService';
import { getRequests } from '../../services/requestService';
import StatsCard from '../../components/common/StatsCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-hot-toast';
import { Package, ClipboardList, CheckCircle, PackageCheck, ArrowRight } from 'lucide-react';

const RecipientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ available: 0, requested: 0, approved: 0, completed: 0 });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [requestsData, medicinesData] = await Promise.all([
          getRequests(),
          getMedicines()
        ]);
        
        setRequests(requestsData);
        setMedicines(medicinesData);
        
        const requested = requestsData.length;
        const approved = requestsData.filter(r => r.status === 'APPROVED').length;
        const completed = requestsData.filter(r => r.status === 'COMPLETED').length;
        const available = medicinesData.length; 
        
        setStats({ available, requested, approved, completed });
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/recipient/medicines?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Hello, {user?.name}!</h1>
          <p className="text-muted mt-1">Find and request the medicines you need.</p>
        </div>
      </div>

      {/* Quick Search */}
      <div className="bg-surface rounded-xl shadow-sm border border-theme p-6">
        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <div className="flex-1">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search for medicines by name or category..." />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2">
            Search
          </button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Available Medicines" value={stats.available + "+"} icon={Package} color="blue" />
        <StatsCard title="My Requests" value={stats.requested} icon={ClipboardList} color="amber" />
        <StatsCard title="Approved" value={stats.approved} icon={CheckCircle} color="green" />
        <StatsCard title="Completed" value={stats.completed} icon={PackageCheck} color="purple" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommended/Available Medicines */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-lg font-semibold text-primary">Recently Added Medicines</h2>
            <Link to="/recipient/medicines" className="text-sm font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1">
              Browse Pool <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {medicines.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                title="No medicines available" 
                description="The medicine pool is currently empty. Please check back later."
                icon={Package}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {medicines.slice(0, 4).map((medicine) => (
                <div key={medicine.id} className="border border-theme rounded-lg p-4 hover:bg-surface2/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-primary line-clamp-1">{medicine.medicineName}</h3>
                    <span className="bg-blue-500/15 text-blue-400 text-xs px-2 py-1 rounded-full font-medium border border-blue-500/30">{medicine.category}</span>
                  </div>
                  <p className="text-sm text-subtle mb-4">{medicine.dosage}</p>
                  <Link 
                    to={`/recipient/medicines/${medicine.id}`}
                    className="block w-full text-center py-2 bg-surface2 hover:bg-surface2/80 text-blue-500 rounded-md font-medium text-sm transition-colors border border-theme"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="px-6 py-5 border-b border-theme flex justify-between items-center bg-surface2/30">
            <h2 className="text-lg font-semibold text-primary">My Recent Requests</h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="p-6">
               <EmptyState 
                title="No requests yet" 
                description="Search the pool to request medicine."
                icon={ClipboardList}
              />
            </div>
          ) : (
            <div className="divide-y divide-theme">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-4 hover:bg-surface2/40 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-primary line-clamp-1">{request.medicineName}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="flex justify-between text-xs text-muted mt-2">
                    <span>Qty: {request.requestedQuantity}</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              <div className="p-4 border-t border-theme bg-surface2/30 text-center">
                <Link to="/recipient/requests" className="text-sm font-medium text-blue-500 hover:text-blue-400">
                  View All Requests
                </Link>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default RecipientDashboard;
