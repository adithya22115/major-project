import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAvailableDonations, findNearestLocations } from '../../services/donationService';
import { formatDistance } from '../../utils/geo';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-hot-toast';
import { Package, Filter, MapPin, Navigation, ExternalLink, AlertTriangle } from 'lucide-react';

const MedicinePool = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [nearestData, setNearestData] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const nearestAbortRef = useRef(null);

  const userCity = user?.city || '';
  const userState = user?.state || '';
  const userLat = user?.latitude || null;
  const userLng = user?.longitude || null;

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const data = await getAvailableDonations();
        if (!cancelled) setDonations(data);
      } catch (_err) {
        if (!cancelled) toast.error('Failed to load medicine pool');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const fetchNearestForMedicine = async (query) => {
    if (!query || !userLat) {
      setNearestData(null);
      return;
    }
    if (nearestAbortRef.current) nearestAbortRef.current.abort();
    const controller = new AbortController();
    nearestAbortRef.current = controller;

    setLocationLoading(true);
    setNearestData(null);
    try {
      const lowerQuery = query.toLowerCase();
      const match = donations.find(d => d.medicineName?.toLowerCase() === lowerQuery)
        || donations.find(d => d.medicineName?.toLowerCase().includes(lowerQuery));
      if (match && match.medicineId) {
        const result = await findNearestLocations(match.medicineId, userLat, userLng, userCity || undefined, userState || undefined);
        if (!controller.signal.aborted && result.nearestLocations && result.nearestLocations.length > 0) {
          setNearestData(result);
        }
      }
    } catch (_err) {
      if (!controller.signal.aborted) setNearestData(null);
    } finally {
      if (!controller.signal.aborted) setLocationLoading(false);
    }
  };

  const filteredDonations = donations.filter(d => {
    const name = d.medicineName?.toLowerCase() || '';
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? d.medicineCategory === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const currentDonations = filteredDonations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const lower = val.trim().toLowerCase();
    if (!lower) {
      setNearestData(null);
      return;
    }

    const newFiltered = donations.filter(d => {
      const name = d.medicineName?.toLowerCase() || '';
      const matchesCategory = categoryFilter ? d.medicineCategory === categoryFilter : true;
      return name.includes(lower) && matchesCategory;
    });

    if (newFiltered.length === 0 && userLat) {
      searchTimerRef.current = setTimeout(() => {
        fetchNearestForMedicine(val.trim());
      }, 600);
    } else {
      setNearestData(null);
    }
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const getConditionColor = (condition) => {
    switch (condition?.toUpperCase()) {
      case 'EXCELLENT': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'GOOD': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'FAIR': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 90 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">Medicine Pool</h1>
          <p className="text-muted mt-1">
            {userCity
              ? `Showing medicines available in ${userCity}${userState ? ', ' + userState : ''}`
              : 'Browse and request available medicines donated by the community.'}
          </p>
        </div>
        {userCity && (
          <div className="flex items-center gap-2 bg-surface border border-theme rounded-lg px-3 py-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-primary font-medium">{userCity}</span>
            {userState && <span className="text-muted">, {userState}</span>}
          </div>
        )}
      </div>

      {!userCity && !userLat && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Location not set</p>
            <p className="text-xs text-muted mt-1">
              Allow location access to see medicines available near you and get directions.
            </p>
            <Link to="/profile" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
              Set Location
            </Link>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl shadow-sm border border-theme p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search medicines..."
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

      {locationLoading && (
        <div className="flex items-center gap-2 text-sm text-muted bg-surface border border-theme rounded-xl p-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Searching nearby locations for "{searchTerm}"...
        </div>
      )}

      {nearestData && nearestData.nearestLocations && nearestData.nearestLocations.length > 0 && !locationLoading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-blue-400">
              "{nearestData.medicineName}" is available nearby
            </p>
          </div>
          <div className="space-y-2">
            {nearestData.nearestLocations.slice(0, 3).map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                  <span className="text-primary truncate">
                    {loc.city}{loc.state ? ', ' + loc.state : ''}
                  </span>
                  {loc.distanceKm > 0 && (
                    <span className="text-blue-400 whitespace-nowrap font-medium">
                      ({formatDistance(loc.distanceKm)})
                    </span>
                  )}
                  <span className="text-muted whitespace-nowrap">
                    {loc.availableQuantity} qty
                  </span>
                  {loc.matchScore != null && (
                    <span className="text-emerald-400 whitespace-nowrap">
                      {Math.round(loc.matchScore)}% match
                    </span>
                  )}
                </div>
                <a
                  href={loc.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 whitespace-nowrap font-semibold bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  title={`Get directions to ${loc.city}`}
                >
                  <Navigation className="w-3 h-3" />
                  Directions
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
            {nearestData.nearestLocations.length > 3 && (
              <p className="text-xs text-muted pl-5">
                +{nearestData.nearestLocations.length - 3} more location{nearestData.nearestLocations.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {filteredDonations.length === 0 ? (
        <EmptyState
          title={searchTerm ? `No "${searchTerm}" found` : 'No medicines found'}
          description={
            nearestData && nearestData.nearestLocations && nearestData.nearestLocations.length > 0
              ? 'Check the nearby location above for this medicine.'
              : searchTerm
                ? 'No approved donations match your search. Try broadening your search or check back later.'
                : 'We couldn\'t find any medicines matching your search criteria.'
          }
          icon={Package}
          action={
            nearestData && nearestData.nearestLocations && nearestData.nearestLocations.length > 0
              ? { label: 'View Nearby Directions', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
              : { label: 'Clear Filters', onClick: () => { setSearchTerm(''); setCategoryFilter(''); } }
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDonations.map((donation) => (
              <div key={donation.id} className="bg-surface border border-theme rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group hover:border-blue-500/30">
                {donation.imageUrls && donation.imageUrls.length > 0 ? (
                  <div className="h-40 bg-surface2 overflow-hidden">
                    <img
                      src={donation.imageUrls[0]}
                      alt={donation.medicineName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-surface2 flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted/30" />
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-500/15 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-500/30">
                      {donation.medicineCategory || 'N/A'}
                    </span>
                    {donation.condition && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getConditionColor(donation.condition)}`}>
                        {donation.condition}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-primary mb-1 group-hover:text-blue-400 transition-colors">
                    {donation.medicineName}
                  </h3>
                  <p className="text-sm font-medium text-muted mb-2">
                    {donation.medicineDosage || ''} • Qty: {donation.quantity}
                  </p>

                  {donation.city && (
                    <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{donation.city}{donation.state ? ', ' + donation.state : ''}</span>
                    </div>
                  )}

                  {donation.expiryDate && (
                    <div className="flex items-center gap-1.5 text-xs mb-2">
                      {isExpired(donation.expiryDate) ? (
                        <span className="text-red-400">Expired</span>
                      ) : isExpiringSoon(donation.expiryDate) ? (
                        <span className="text-amber-400">Expires {new Date(donation.expiryDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-muted">Exp: {new Date(donation.expiryDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  )}

                  {donation.remarks && (
                    <p className="text-xs text-muted line-clamp-2 mt-2">{donation.remarks}</p>
                  )}
                </div>

                <div className="px-6 py-4 bg-surface2/50 border-t border-theme flex gap-2">
                  <Link
                    to={`/recipient/medicines/${donation.medicineId || donation.id}`}
                    className="flex-1 text-center py-2.5 px-4 border border-blue-500/50 rounded-lg text-sm font-medium text-blue-400 bg-surface hover:bg-blue-500/10 transition-colors"
                  >
                    View & Request
                  </Link>
                  {donation.latitude && donation.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${userLat && userLng ? userLat + ',' + userLng : encodeURIComponent(userCity || '')}&destination=${donation.latitude},${donation.longitude}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 py-2.5 px-3 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
                      title="Get directions on Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Directions
                    </a>
                  )}
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
