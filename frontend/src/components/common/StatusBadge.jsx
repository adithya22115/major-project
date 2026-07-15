import React from 'react';

const StatusBadge = ({ status }) => {
  let colorClass = '';
  let dotClass = '';
  let label = status?.replace('_', ' ');

  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED':
      colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      dotClass   = 'bg-emerald-400';
      break;
    case 'PENDING':
    case 'UNDER_REVIEW':
      colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      dotClass   = 'bg-amber-400 animate-pulse';
      break;
    case 'REJECTED':
      colorClass = 'bg-red-500/15 text-red-400 border-red-500/30';
      dotClass   = 'bg-red-400';
      break;
    case 'DISTRIBUTED':
      colorClass = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      dotClass   = 'bg-blue-400';
      break;
    case 'EXPIRED':
      colorClass = 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      dotClass   = 'bg-slate-500';
      break;
    default:
      colorClass = 'bg-slate-500/15 text-slate-400 border-slate-500/30';
      dotClass   = 'bg-slate-500';
      label      = status || 'UNKNOWN';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="capitalize">{label?.toLowerCase()}</span>
    </span>
  );
};

export default StatusBadge;
