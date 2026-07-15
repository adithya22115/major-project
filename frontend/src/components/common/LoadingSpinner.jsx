import React from 'react';
import { Pill } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading MediCycle...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-surface2"></div>
        <div className="h-16 w-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600">
          <Pill className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
