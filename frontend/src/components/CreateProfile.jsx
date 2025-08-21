import React, { useState } from 'react';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { validateProfile, PROVIDERS } from '../utils/helpers';
import toast from 'react-hot-toast';

const CreateProfile = ({ onViewChange }) => {
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    activationCode: '',
    smdpServerUrl: '',
    provider: '',
    status: 'created'
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    
    // Validate form data
    const validation = validateProfile(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors below');
      return;
    }
    
    try {
      setLoading(true);
      const response = await eSIMAPI.createProfile(formData);
      
      if (response.success) {
        toast.success('eSIM profile created successfully!');
        // Reset form
        setFormData({
          displayName: '',
          description: '',
          activationCode: '',
          smdpServerUrl: '',
          provider: '',
          status: 'created'
        });
        setErrors({});
        // Navigate back to list view
        setTimeout(() => onViewChange('list'), 1500);
      }
    } catch (error) {
      console.error('Create profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onViewChange('dashboard');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleCancel}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New eSIM Profile</h1>
        <p className="text-gray-600">
          Add a new eSIM profile for ATOM, Ooredoo, Mytel, or MPT providers
        </p>
      </div>

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
              <div className="mt-1 flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  This is the unique activation code provided by your eSIM provider
                </p>
              </div>
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
              <div className="mt-1 flex items-start space-x-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  The SM-DP+ server URL provided by your eSIM provider
                </p>
              </div>
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

            {/* Provider Information */}
            {formData.provider && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      {formData.provider} Provider Information
                    </h4>
                    <p className="text-sm text-blue-700">
                      {formData.provider === 'ATOM' && 'ATOM Telecommunications - Myanmar leading telecom provider'}
                      {formData.provider === 'Ooredoo' && 'Ooredoo Myanmar - International telecommunications company'}
                      {formData.provider === 'Mytel' && 'Mytel - Joint venture telecom operator in Myanmar'}
                      {formData.provider === 'MPT' && 'Myanmar Posts and Telecommunications - State-owned telecom operator'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
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
                className="btn-primary flex items-center space-x-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    <span>Create Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 max-w-2xl">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• <strong>Display Name:</strong> A unique, descriptive name for easy identification</p>
            <p>• <strong>Provider:</strong> Select your eSIM service provider</p>
            <p>• <strong>Activation Code:</strong> The QR code data or activation string from your provider</p>
            <p>• <strong>SMDP Server URL:</strong> The server address for profile download and management</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;