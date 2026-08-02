import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getOverview } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  BarChart3, Download, Filter, Users, Package, FileText,
  Pill, MapPin, TrendingUp, RefreshCw, Eye, EyeOff,
  Heart, User, Building2, ShieldCheck
} from 'lucide-react';

/* ================================================================
   REUSABLE CHART COMPONENTS (pure SVG — no external library)
   ================================================================ */

// ─── Donut Chart ────────────────────────────────────────────────
const DonutChart = ({ data, size = 200, thickness = 36 }) => {
  const [hovered, setHovered] = useState(null);
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimProgress(0);
    const start = performance.now();
    const duration = 800;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [data]);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-sm text-muted">No data</p>
      </div>
    );
  }

  const cx = size / 2, cy = size / 2, r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={thickness} opacity={0.3} />
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = circumference * pct * animProgress;
          const gap = circumference - dash;
          const offset = -circumference * cumulative * animProgress + circumference * 0.25;
          cumulative += pct;
          const isHovered = hovered === i;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={isHovered ? thickness + 6 : thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-width 0.2s ease',
                filter: isHovered ? 'brightness(1.2)' : 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </svg>
      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {hovered !== null ? (
          <>
            <span className="text-xl font-bold text-primary">{data[hovered].value}</span>
            <span className="text-xs text-muted">{((data[hovered].value / total) * 100).toFixed(1)}%</span>
          </>
        ) : (
          <>
            <span className="text-xl font-bold text-primary">{total}</span>
            <span className="text-xs text-muted">Total</span>
          </>
        )}
      </div>
      {/* tooltip */}
      {hovered !== null && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-surface border border-theme rounded-lg px-3 py-2 shadow-xl z-10 pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: data[hovered].color }} />
            <span className="text-xs font-medium text-primary">{data[hovered].label}</span>
          </div>
          <p className="text-xs text-muted mt-0.5">{data[hovered].value} ({((data[hovered].value / total) * 100).toFixed(1)}%)</p>
        </div>
      )}
    </div>
  );
};

// ─── Horizontal Bar Chart ───────────────────────────────────────
const HorizontalBarChart = ({ data, maxBars = 8 }) => {
  const [hovered, setHovered] = useState(null);
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimProgress(0);
    const start = performance.now();
    const duration = 900;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [data]);

  const sliced = data.slice(0, maxBars);
  const maxVal = Math.max(...sliced.map(d => d.value), 1);

  if (sliced.length === 0) {
    return <p className="text-sm text-muted text-center py-8">No data available</p>;
  }

  return (
    <div className="space-y-2.5">
      {sliced.map((d, i) => (
        <div
          key={i}
          className="group cursor-pointer"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-medium truncate max-w-[60%] ${hovered === i ? 'text-primary' : 'text-muted'} transition-colors`}>
              {d.label}
            </span>
            <span className={`text-xs font-bold ${hovered === i ? 'text-primary' : 'text-muted'} transition-colors`}>
              {d.value}
            </span>
          </div>
          <div className="w-full h-5 bg-surface2 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(d.value / maxVal) * 100 * animProgress}%`,
                background: d.color || `hsl(${210 + i * 30}, 70%, 55%)`,
                opacity: hovered === null || hovered === i ? 1 : 0.4,
              }}
            />
            {hovered === i && d.segments && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                {d.segments.map((seg, si) => (
                  <span key={si} className="text-[10px] text-white/80 font-medium">{seg.label}: {seg.value}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Vertical Bar Chart ─────────────────────────────────────────
const VerticalBarChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimProgress(0);
    const start = performance.now();
    const duration = 800;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [data]);

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartH = 160;

  if (data.length === 0) {
    return <p className="text-sm text-muted text-center py-8">No data available</p>;
  }

  return (
    <div className="flex items-end gap-2 justify-center" style={{ height: chartH + 30 }}>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH * animProgress;
        const isHovered = hovered === i;
        return (
          <div
            key={i}
            className="flex flex-col items-center relative cursor-pointer"
            style={{ flex: '1 1 0', maxWidth: 60 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* tooltip */}
            {isHovered && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-theme rounded-lg px-2 py-1 shadow-xl z-10 pointer-events-none whitespace-nowrap">
                <p className="text-xs font-medium text-primary">{d.label}: {d.value}</p>
              </div>
            )}
            {/* value above bar */}
            <span className={`text-xs font-bold mb-1 transition-opacity ${isHovered ? 'opacity-100 text-primary' : 'opacity-60 text-muted'}`}>
              {d.value}
            </span>
            {/* bar */}
            <div
              className="w-full rounded-t-lg transition-all duration-200"
              style={{
                height: barH,
                background: d.color || `hsl(${200 + i * 40}, 65%, 55%)`,
                opacity: hovered === null || isHovered ? 1 : 0.4,
                minHeight: d.value > 0 ? 4 : 0,
              }}
            />
            {/* label */}
            <span className="text-[10px] text-muted mt-1.5 truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Animated Counter ───────────────────────────────────────────
const AnimatedCounter = ({ value, duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
};

/* ================================================================
   CHART DEFINITIONS
   ================================================================ */

const CHART_PANELS = [
  { key: 'userDist', label: 'User Distribution', icon: Users },
  { key: 'donationStatus', label: 'Donation Status', icon: Package },
  { key: 'requestStatus', label: 'Request Status', icon: FileText },
  { key: 'cityActivity', label: 'City Activity', icon: MapPin },
  { key: 'medicineCategory', label: 'Medicine Categories', icon: Pill },
  { key: 'platformSummary', label: 'Platform Summary', icon: TrendingUp },
];

/* ================================================================
   MAIN REPORTS COMPONENT
   ================================================================ */

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [visiblePanels, setVisiblePanels] = useState(
    CHART_PANELS.reduce((acc, p) => ({ ...acc, [p.key]: true }), {})
  );
  const [showFilter, setShowFilter] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOverview();
      setData(result);
    } catch (_err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePanel = (key) => {
    setVisiblePanels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // CSV Export
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', data.totalUsers],
      ['Donors', data.totalDonors],
      ['Recipients', data.totalRecipients],
      ['Pharmacies', data.totalPharmacies],
      ['Verified Pharmacies', data.verifiedPharmacies],
      ['Total Medicines', data.totalMedicines],
      ['Total Donations', data.totalDonations],
      ['Pending Donations', data.pendingDonations],
      ['Approved Donations', data.approvedDonations],
      ['Rejected Donations', data.rejectedDonations],
      ['Total Donation Qty', data.totalDonationQuantity],
      ['Total Requests', data.totalRequests],
      ['Pending Requests', data.pendingRequests],
      ['Approved Requests', data.approvedRequests],
      ['Completed Requests', data.completedRequests],
      ['Rejected Requests', data.rejectedRequests],
      ['Total Prescriptions', data.totalPrescriptions],
      ['', ''],
      ['City', 'Donations', 'Requests', 'Users', 'Pharmacies'],
      ...(data.cityStats || []).map(c => [c.city, c.donationCount, c.requestCount, c.userCount, c.pharmacyCount]),
      ['', ''],
      ['Medicine', 'Category', 'Manufacturer', 'Rx Required'],
      ...(data.allMedicines || []).map(m => [m.medicineName, m.category, m.manufacturer, m.requiresPrescription ? 'Yes' : 'No']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicycle-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-center text-muted py-12">No data available</div>;

  // ── Chart data preparation ──
  const userDistData = [
    { label: 'Donors', value: data.totalDonors || 0, color: '#f43f5e' },
    { label: 'Recipients', value: data.totalRecipients || 0, color: '#06b6d4' },
    { label: 'Pharmacies', value: data.totalPharmacies || 0, color: '#a855f7' },
    { label: 'Admins', value: data.totalAdmins || 0, color: '#6366f1' },
  ];

  const donationStatusData = [
    { label: 'Pending', value: data.pendingDonations || 0, color: '#f59e0b' },
    { label: 'Approved', value: data.approvedDonations || 0, color: '#10b981' },
    { label: 'Rejected', value: data.rejectedDonations || 0, color: '#ef4444' },
  ];

  const requestStatusData = [
    { label: 'Pending', value: data.pendingRequests || 0, color: '#f59e0b' },
    { label: 'Approved', value: data.approvedRequests || 0, color: '#3b82f6' },
    { label: 'Completed', value: data.completedRequests || 0, color: '#10b981' },
    { label: 'Rejected', value: data.rejectedRequests || 0, color: '#ef4444' },
  ];

  const cityData = (data.cityStats || [])
    .sort((a, b) => (b.donationCount + b.requestCount) - (a.donationCount + a.requestCount))
    .map((c, i) => ({
      label: c.city || 'Unknown',
      value: c.donationCount + c.requestCount + c.userCount,
      color: `hsl(${210 + i * 35}, 65%, 55%)`,
      segments: [
        { label: 'Donations', value: c.donationCount },
        { label: 'Requests', value: c.requestCount },
        { label: 'Users', value: c.userCount },
      ],
    }));

  // Group medicines by category
  const categoryMap = {};
  (data.allMedicines || []).forEach(m => {
    const cat = m.category || 'Uncategorized';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: `hsl(${160 + i * 45}, 60%, 50%)`,
    }));

  const summaryStats = [
    { label: 'Total Users', value: data.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Qty Donated', value: data.totalDonationQuantity || 0, icon: Package, color: 'emerald' },
    { label: 'Inventory Items', value: data.totalInventoryItems || 0, icon: Pill, color: 'purple' },
    { label: 'Prescriptions', value: data.totalPrescriptions || 0, icon: FileText, color: 'amber' },
    { label: 'Verified Pharmacies', value: data.verifiedPharmacies || 0, icon: Building2, color: 'cyan' },
    { label: 'Total Medicines', value: data.totalMedicines || 0, icon: Pill, color: 'rose' },
  ];

  // ── Panel wrapper ──
  const ChartCard = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`bg-surface border border-theme rounded-xl overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-theme flex items-center gap-2.5">
        <div className="bg-blue-500/15 p-1.5 rounded-lg">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  // ── Legend row ──
  const Legend = ({ items }) => (
    <div className="flex flex-wrap gap-3 mt-4 justify-center">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-xs text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Platform Reports
          </h1>
          <p className="text-muted mt-1">Analytics and insights across the entire platform.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-muted hover:text-primary transition-colors"
          >
            <Filter className="w-4 h-4" />
            Fields
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-theme rounded-lg text-sm text-muted hover:text-primary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white font-medium transition-colors shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Field Selector */}
      {showFilter && (
        <div className="bg-surface border border-theme rounded-xl p-4 animate-in">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Toggle Chart Panels</p>
          <div className="flex flex-wrap gap-2">
            {CHART_PANELS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => togglePanel(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  visiblePanels[key]
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : 'bg-surface2 border-theme text-muted hover:text-primary'
                }`}
              >
                {visiblePanels[key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 1: Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visiblePanels.userDist && (
          <ChartCard title="User Distribution" icon={Users}>
            <div className="flex justify-center">
              <DonutChart data={userDistData} size={180} thickness={32} />
            </div>
            <Legend items={userDistData} />
          </ChartCard>
        )}

        {visiblePanels.donationStatus && (
          <ChartCard title="Donation Status" icon={Package}>
            <div className="flex justify-center">
              <DonutChart data={donationStatusData} size={180} thickness={32} />
            </div>
            <Legend items={donationStatusData} />
          </ChartCard>
        )}

        {visiblePanels.requestStatus && (
          <ChartCard title="Request Status" icon={FileText}>
            <div className="flex justify-center">
              <DonutChart data={requestStatusData} size={180} thickness={32} />
            </div>
            <Legend items={requestStatusData} />
          </ChartCard>
        )}
      </div>

      {/* Row 2: Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visiblePanels.cityActivity && (
          <ChartCard title="Top Cities by Activity" icon={MapPin}>
            <HorizontalBarChart data={cityData} maxBars={8} />
          </ChartCard>
        )}

        {visiblePanels.medicineCategory && (
          <ChartCard title="Medicine Categories" icon={Pill}>
            <VerticalBarChart data={categoryData} />
          </ChartCard>
        )}
      </div>

      {/* Row 3: Platform Summary */}
      {visiblePanels.platformSummary && (
        <ChartCard title="Platform Summary" icon={TrendingUp} className="">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {summaryStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-surface2/50 rounded-xl p-4 text-center border border-theme/50 hover:border-blue-500/30 transition-colors group">
                  <div className={`bg-${stat.color}-500/15 p-2.5 rounded-xl mx-auto w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="text-xs text-muted mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </ChartCard>
      )}

      {/* No panels selected */}
      {Object.values(visiblePanels).every(v => !v) && (
        <div className="bg-surface border border-theme rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <p className="text-muted font-medium">No charts selected</p>
          <p className="text-sm text-subtle mt-1">Use the "Fields" button above to select which charts to display.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
