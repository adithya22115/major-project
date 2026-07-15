import React from 'react';
import EmptyState from '../../components/common/EmptyState';
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Reports</h1>
        <p className="text-muted mt-1">Analytics and data exports are currently under development.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme p-12">
        <EmptyState 
          title="Reporting Module Coming Soon" 
          description="The advanced analytics and reporting module is scheduled for the next release phase. You will be able to export CSV data and view historical trends here."
          icon={BarChart3}
        />
      </div>
    </div>
  );
};

export default Reports;
