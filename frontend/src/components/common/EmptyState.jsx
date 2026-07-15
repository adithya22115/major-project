import React from 'react';

const EmptyState = ({ title, description, icon: Icon, action }) => {
  return (
    <div className="text-center py-16 px-4 bg-surface rounded-lg border border-dashed border-theme">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface2 mb-4">
        {Icon && <Icon className="h-6 w-6 text-muted" />}
      </div>
      <h3 className="text-lg font-medium text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mx-auto mb-6">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
