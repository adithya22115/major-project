import React from 'react';
import EmptyState from '../../components/common/EmptyState';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Platform Settings</h1>
        <p className="text-muted mt-1">Configure global application parameters.</p>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme p-12">
        <EmptyState 
          title="Settings Configuration" 
          description="Global configuration options will be available in the upcoming admin tools update."
          icon={SettingsIcon}
        />
      </div>
    </div>
  );
};

export default Settings;
