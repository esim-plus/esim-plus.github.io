import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { getStatusClasses, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const DeployProfile = ({ profile, onViewChange }) => {
  const [deploymentData, setDeploymentData] = useState({
    profileId: '',
    targetDeviceId: '',
    deploymentNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (profile) {
      setDeploymentData(prev => ({
        ...prev,
        profileId: profile.id
      }));
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeploymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    
    if (!window.confirm('Are you sure you want to deploy this eSIM profile? This action will push the profile to Microsoft Intune.')) {
      return;
    }
    
    try {
      setLoading(true);
      setDeploymentResult(null);
      
      const response = await eSIMAPI.deployProfile(deploymentData);
      setDeploymentResult(response);
      
      if (response.success) {
        toast.success('Profile deployment initiated successfully!');
      } else {
        toast.error('Profile deployment failed. Check the results below.');
      }
    } catch (error) {
      console.error('Deploy profile error:', error);
      setDeploymentResult({
        success: false,
        message: 'Deployment failed due to network error',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onViewChange('list');
  };

  const canDeploy = profile && ['created', 'error'].includes(profile.status);

  if (!profile) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Selected</h2>
          <p className="text-gray-600 mb-4">Please select a profile to deploy.</p>
          <button
            onClick={() => onViewChange('list')}
            className="btn-primary"
          >
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Profiles
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Deploy eSIM Profile</h1>
            <p className="text-gray-600">
              Deploy "{profile.displayName}" to managed devices via Microsoft Intune
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={getStatusClasses(profile.status)}>
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Status Warning */}
      {!canDeploy && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900 mb-1">
                  Profile Cannot Be Deployed
                </h4>
                <p className="text-sm text-yellow-700">
                  {profile.status === 'deployed' && 'This profile has already been deployed.'}
                  {profile.status === 'active' && 'This profile is currently active and cannot be redeployed.'}
                  {profile.status === 'deploying' && 'This profile is currently being deployed.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-700">Display Name</dt>
              <dd className="text-sm text-gray-900">{profile.displayName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-700">Provider</dt>
              <dd className="text-sm text-gray-900">{profile.provider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-700">Status</dt>
              <dd>
                <span className={getStatusClasses(profile.status)}>
                  {profile.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-700">Created</dt>
              <dd className="text-sm text-gray-900">{formatDate(profile.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-700">SMDP Server</dt>
              <dd className="text-sm text-gray-900 font-mono break-all">{profile.smdpServerUrl}</dd>
            </div>
          </dl>
          
          {profile.description && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{profile.description}</p>
            </div>
          )}
        </div>

        {/* Deployment Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deployment Options</h2>
          
          <form onSubmit={handleDeploy} className="space-y-4">
            {/* Target Device ID */}
            <div>
              <label htmlFor="targetDeviceId" className="block text-sm font-medium text-gray-700 mb-2">
                Target Device ID (Optional)
              </label>
              <input
                type="text"
                id="targetDeviceId"
                name="targetDeviceId"
                value={deploymentData.targetDeviceId}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Leave empty to deploy to all devices"
                disabled={!canDeploy || loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify a device ID to deploy only to that device, or leave empty for all devices
              </p>
            </div>

            {/* Deployment Notes */}
            <div>
              <label htmlFor="deploymentNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Deployment Notes
              </label>
              <textarea
                id="deploymentNotes"
                name="deploymentNotes"
                value={deploymentData.deploymentNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Optional notes for this deployment"
                disabled={!canDeploy || loading}
              />
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="forceDeploy"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={!canDeploy || loading}
                      />
                      <label htmlFor="forceDeploy" className="ml-2 text-sm text-gray-700">
                        Force deployment (override existing profiles)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifyUsers"
                        defaultChecked
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        disabled={!canDeploy || loading}
                      />
                      <label htmlFor="notifyUsers" className="ml-2 text-sm text-gray-700">
                        Notify users about profile installation
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deploy Button */}
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full btn-primary flex items-center justify-center space-x-2 ${!canDeploy ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canDeploy || loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <RocketLaunchIcon className="w-4 h-4" />
                    <span>Deploy Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Deployment Result */}
      {deploymentResult && (
        <div className="mt-8">
          <div className={`card ${deploymentResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start space-x-3">
              {deploymentResult.success ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${deploymentResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {deploymentResult.success ? 'Deployment Successful' : 'Deployment Failed'}
                </h3>
                <p className={`text-sm mb-4 ${deploymentResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {deploymentResult.message}
                </p>
                
                {/* Deployment Details */}
                {deploymentResult.deploymentResult && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-2">Deployment Details</h4>
                    <div className="space-y-2 text-sm">
                      {deploymentResult.success && deploymentResult.deploymentResult.stdout && (
                        <div>
                          <span className="font-medium text-gray-700">PowerShell Output:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {deploymentResult.deploymentResult.stdout}
                          </pre>
                        </div>
                      )}
                      
                      {!deploymentResult.success && deploymentResult.deploymentResult.stderr && (
                        <div>
                          <span className="font-medium text-gray-700">Error Details:</span>
                          <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                            {deploymentResult.deploymentResult.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {deploymentResult.error && (
                        <div>
                          <span className="font-medium text-gray-700">Error:</span>
                          <p className="text-red-600">{deploymentResult.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Next Steps */}
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    onClick={() => onViewChange('logs', profile)}
                    className="btn-secondary text-sm"
                  >
                    View Logs
                  </button>
                  <button
                    onClick={() => onViewChange('list')}
                    className="btn-primary text-sm"
                  >
                    Back to Profiles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deployment Information */}
      <div className="mt-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">About eSIM Deployment</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Deployment pushes the eSIM profile to Microsoft Intune for device management</p>
                <p>• Devices must be enrolled in Intune to receive the profile</p>
                <p>• The deployment process may take several minutes to complete</p>
                <p>• You can monitor deployment status in the profile logs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeployProfile;