import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  PencilIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { validateProfile, PROVIDERS, getStatusClasses } from '../utils/helpers';
import toast from 'react-hot-toast';

const UpdateProfile = ({ profile, onViewChange }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    activationCode: '',
    smdpServerUrl: '',
    provider: '',
    status: 'created'
  });
  
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      const data = {
        displayName: profile.displayName || '',
        description: profile.description || '',
        activationCode: profile.activationCode || '',
        smdpServerUrl: profile.smdpServerUrl || '',
        provider: profile.provider || '',
        status: profile.status || 'created'
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [profile]);

  useEffect(() => {
    // Check if form data has changed
    const changed = Object.keys(formData).some(key => 
      formData[key] !== originalData[key]
    );
    setHasChanges(changed);
  }, [formData, originalData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    
    // Validate form data
    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors below');
      return;
    }
    
    try {
      setLoading(true);
      
      // Only send changed fields
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          updateData[key] = formData[key];
        }
      });
      
      const response = await eSIMAPI.updateProfile(profile.id, updateData);
      
      if (response.success) {
        toast.success('eSIM profile updated successfully!');
        setOriginalData(formData);
        setHasChanges(false);
        setErrors({});
        // Navigate back to list view
        setTimeout(() => onViewChange('list'), 1500);
      }
    } catch (error) {
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onViewChange('list');
      }
    } else {
      onViewChange('list');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      setFormData(originalData);
      setErrors({});
    }
  };

  if (!profile) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Selected</h2>
          <p className="text-gray-600 mb-4">Please select a profile to update.</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Update eSIM Profile</h1>
            <p className="text-gray-600">
              Modify the settings for "{profile.displayName}"
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={getStatusClasses(profile.status)}>
              {profile.status}
            </span>
            <span className="text-sm text-gray-500">
              ID: {profile.id}
            </span>
          </div>
        </div>
      </div>

      {/* Update Warning */}
      {(profile.status === 'deployed' || profile.status === 'active') && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900 mb-1">
                  Caution: Profile is {profile.status}
                </h4>
                <p className="text-sm text-yellow-700">
                  Updating a {profile.status} profile may affect active devices. Consider creating a new profile instead.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="max-w-2xl">
        <div className="form-container rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className={`input-field ${errors.displayName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter a descriptive name for this profile"
                maxLength={100}
                required
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
              )}
            </div>

            {/* Provider */}
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                Provider *
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className={`input-field ${errors.provider ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              >
                <option value="">Select a provider</option>
                {PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
              {errors.provider && (
                <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="created">Created</option>
                <option value="deployed">Deployed</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Activation Code */}
            <div>
              <label htmlFor="activationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Activation Code *
              </label>
              <textarea
                id="activationCode"
                name="activationCode"
                value={formData.activationCode}
                onChange={handleInputChange}
                rows={3}
                className={`input-field ${errors.activationCode ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter the eSIM activation code"
                required
              />
              {errors.activationCode && (
                <p className="mt-1 text-sm text-red-600">{errors.activationCode}</p>
              )}
            </div>

            {/* SMDP Server URL */}
            <div>
              <label htmlFor="smdpServerUrl" className="block text-sm font-medium text-gray-700 mb-2">
                SMDP Server URL *
              </label>
              <input
                type="url"
                id="smdpServerUrl"
                name="smdpServerUrl"
                value={formData.smdpServerUrl}
                onChange={handleInputChange}
                className={`input-field ${errors.smdpServerUrl ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="https://smdp.example.com"
                required
              />
              {errors.smdpServerUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.smdpServerUrl}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`input-field ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Optional description for this profile"
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    Reset Changes
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-primary flex items-center space-x-2 ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading || !hasChanges}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-8 max-w-2xl">
        <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Information</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-700">Profile ID</dt>
              <dd className="text-gray-600 font-mono text-xs">{profile.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Created</dt>
              <dd className="text-gray-600">{new Date(profile.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Last Updated</dt>
              <dd className="text-gray-600">{new Date(profile.updatedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">Current Status</dt>
              <dd>
                <span className={getStatusClasses(profile.status)}>
                  {profile.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;