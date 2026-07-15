import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMedicines } from '../../services/medicineService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';
import { Package, Filter } from 'lucide-react';

const MedicinePool = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Grid of 3x3

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const data = await getMedicines();
        setMedicines(data);
      } catch (err) {
        toast.error('Failed to load medicine pool');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? med.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
  const currentMedicines = filteredMedicines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
    
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">Medicine Pool</h1>
          <p className="text-muted mt-1">Browse and request available medicines donated by the community.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-xl shadow-sm border border-theme p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar 
              value={searchTerm} 
              onChange={handleSearchChange} 
              placeholder="Search medicines, descriptions, or conditions..." 
            />
          </div>
          <div className="sm:w-48 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-muted" />
            </div>
            <select
              value={categoryFilter}
              onChange={handleCategoryChange}
              className="block w-full pl-10 pr-10 py-2 border border-theme rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-surface2 text-primary shadow-sm appearance-none transition-colors"
            >
              <option value="">All Categories</option>
              <option value="TABLET">Tablet</option>
              <option value="CAPSULE">Capsule</option>
              <option value="SYRUP">Syrup</option>
              <option value="INJECTION">Injection</option>
              <option value="CREAM">Cream/Ointment</option>
              <option value="DROPS">Drops</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredMedicines.length === 0 ? (
        <EmptyState 
          title="No medicines found" 
          description="We couldn't find any medicines matching your search criteria."
          icon={Package}
          action={{ label: 'Clear Filters', onClick: () => { setSearchTerm(''); setCategoryFilter(''); } }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentMedicines.map((medicine) => (
              <div key={medicine.id} className="bg-surface border border-theme rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group hover:border-blue-500/30">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-500/15 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-500/30">
                      {medicine.category}
                    </span>
                    {medicine.requiresPrescription && (
                      <span className="bg-amber-500/15 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-500/30">
                        Rx Required
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-primary mb-1 group-hover:text-blue-400 transition-colors">
                    {medicine.medicineName}
                  </h3>
                  <p className="text-sm font-medium text-muted mb-3">{medicine.dosage} • {medicine.manufacturer}</p>
                  
                  <p className="text-sm text-muted line-clamp-2 mb-4">
                    {medicine.description || "No description provided."}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-theme flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded-md border border-emerald-500/30">
                      Available in Pool
                    </span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-surface2/50 border-t border-theme">
                  <Link 
                    to={`/recipient/medicines/${medicine.id}`}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-blue-500/50 rounded-lg shadow-sm text-sm font-medium text-blue-400 bg-surface hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    View Details & Request
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default MedicinePool;
