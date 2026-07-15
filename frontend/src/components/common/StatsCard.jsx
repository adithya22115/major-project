import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue:   'bg-blue-500/15 text-blue-400',
    green:  'bg-emerald-500/15 text-emerald-400',
    amber:  'bg-amber-500/15 text-amber-400',
    red:    'bg-red-500/15 text-red-400',
    purple: 'bg-purple-500/15 text-purple-400',
  };

  const iconClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-theme p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-primary">{value}</h3>

          {trend && (
            <p className="mt-2 text-xs font-medium text-emerald-400 flex items-center gap-1">
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconClass}`}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
