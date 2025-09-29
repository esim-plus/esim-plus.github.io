import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { migrationAPI, eSIMAPI } from '../services/api';
import toast from 'react-hot-toast';

function DeviceMigration({ profile, onViewChange, user }) {
  const [migrationData, setMigrationData] = useState({
    sourceDeviceId: '',
    targetDeviceId: '',
    migrationNotes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [migrations, setMigrations] = useState([]);
  const [isLoadingMigrations, setIsLoadingMigrations] = useState(true);

  useEffect(() => {
    if (profile?.deviceId) {
      setMigrationData(prev => ({
        ...prev,
        sourceDeviceId: profile.deviceId
      }));
    }
    // Note: In a real implementation, you would fetch existing migrations here
    setIsLoadingMigrations(false);
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMigrationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!migrationData.targetDeviceId.trim()) {
      toast.error('Target device ID is required');
      return;
    }

    if (migrationData.sourceDeviceId === migrationData.targetDeviceId) {
      toast.error('Source and target devices cannot be the same');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        profileId: profile.id,
        sourceDeviceId: migrationData.sourceDeviceId,
        targetDeviceId: migrationData.targetDeviceId,
        migrationNotes: migrationData.migrationNotes
      };

      const response = await migrationAPI.initiateMigration(payload);
      
      if (response.success) {
        toast.success('Device migration initiated successfully!');
        // Reset form
        setMigrationData({
          sourceDeviceId: profile.deviceId || '',
          targetDeviceId: '',
          migrationNotes: ''
        });
        // Refresh migrations list (in real implementation)
        // fetchMigrations();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error(error.response?.data?.detail || 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDeviceId = (deviceId) => {
    // Basic device ID validation - can be enhanced based on requirements
    const deviceIdPattern = /^[a-zA-Z0-9-_]{8,64}$/;
    return deviceIdPattern.test(deviceId);
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile selected</h3>
        <p className="mt-1 text-sm text-gray-500">Select a profile to manage device migration</p>
        <button
          onClick={() => onViewChange('list')}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Profiles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="device-migration">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Device Migration</h1>
              <p className="mt-1 text-sm text-gray-500">
                Migrate eSIM profile between devices
              </p>
            </div>
            <button
              onClick={() => onViewChange('list')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Profiles
            </button>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Display Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.displayName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provider</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.provider === 'MPT' ? 'bg-blue-100 text-blue-800' :
                  profile.provider === 'ATOM' ? 'bg-green-100 text-green-800' :
                  profile.provider === 'OOREDOO' ? 'bg-yellow-100 text-yellow-800' :
                  profile.provider === 'MYTEL' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.provider}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Device ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {profile.deviceId || 'Not assigned'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-800' :
                  profile.status === 'deployed' ? 'bg-blue-100 text-blue-800' :
                  profile.status === 'migrating' ? 'bg-yellow-100 text-yellow-800' :
                  profile.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                </span>
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Initiate Device Migration</h2>
          
          {profile.status === 'migrating' && (
            <div className="mb-6 rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    A migration is currently in progress for this profile. Please wait for it to complete before initiating a new migration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Device */}
            <div>
              <label htmlFor="sourceDeviceId" className="block text-sm font-medium text-gray-700">
                Source Device ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="sourceDeviceId"
                  name="sourceDeviceId"
                  value={migrationData.sourceDeviceId}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter source device ID"
                  disabled={isLoading}
                  data-testid="source-device-input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Device ID of the device currently using this eSIM profile
                </p>
              </div>
            </div>

            {/* Target Device */}
            <div>
              <label htmlFor="targetDeviceId" className="block text-sm font-medium text-gray-700">
                Target Device ID <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="targetDeviceId"
                  name="targetDeviceId"
                  value={migrationData.targetDeviceId}
                  onChange={handleInputChange}
                  className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                    migrationData.targetDeviceId && !validateDeviceId(migrationData.targetDeviceId) ?
                    'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter target device ID"
                  required
                  disabled={isLoading}
                  data-testid="target-device-input"
                />
                {migrationData.targetDeviceId && !validateDeviceId(migrationData.targetDeviceId) && (
                  <p className="mt-1 text-xs text-red-600">
                    Invalid device ID format. Use 8-64 alphanumeric characters, hyphens, or underscores.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Device ID of the device that will receive this eSIM profile
                </p>
              </div>
            </div>

            {/* Migration Notes */}
            <div>
              <label htmlFor="migrationNotes" className="block text-sm font-medium text-gray-700">
                Migration Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="migrationNotes"
                  name="migrationNotes"
                  rows={3}
                  value={migrationData.migrationNotes}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Optional notes about this migration..."
                  disabled={isLoading}
                  data-testid="migration-notes-input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => onViewChange('list')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || profile.status === 'migrating' || !migrationData.targetDeviceId || !validateDeviceId(migrationData.targetDeviceId)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="initiate-migration-button"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initiating Migration...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Initiate Migration
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Migration Guidelines */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Migration Guidelines</h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Ensure the target device supports eSIM functionality</li>
              <li>The source device should have the eSIM profile currently active</li>
              <li>Migration may take several minutes to complete</li>
              <li>Both devices should have stable internet connectivity</li>
              <li>Contact {profile.provider} support if migration fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeviceMigration;