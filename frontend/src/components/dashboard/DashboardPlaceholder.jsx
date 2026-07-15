import React from 'react';

const DashboardPlaceholder = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Welcome to your dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Donations</span>
              <span className="font-medium text-gray-900">124</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Requests</span>
              <span className="font-medium text-gray-900">28</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Verified Medicines</span>
              <span className="font-medium text-gray-900">456</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">New donation received</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">Request fulfilled</p>
              <p className="text-sm text-gray-500">5 hours ago</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">Inventory updated</p>
              <p className="text-sm text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100">
              Donate Medicine
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100">
              Search Medicines
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100">
              View Requests
            </button>
            <button className="w-full text-left px-4 py-2 bg-gray-50 rounded-md hover:bg-gray-100">
              Update Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlaceholder;