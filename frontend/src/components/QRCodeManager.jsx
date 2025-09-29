import React, { useState, useEffect } from 'react';
import { QrCodeIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';
import { qrCodeAPI } from '../services/api';
import toast from 'react-hot-toast';

function QRCodeManager({ profile, onViewChange, user }) {
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile?.id) {
      fetchQRCode();
    }
  }, [profile]);

  const fetchQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await qrCodeAPI.getQRCode(profile.id);
      if (response.success) {
        setQrData(response.qrCode);
      } else {
        throw new Error('Failed to fetch QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError(error.message || 'Failed to fetch QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = async () => {
    try {
      const filename = `eSIM-QR-${profile.displayName.replace(/\s+/g, '-')}-${profile.provider}.png`;
      await qrCodeAPI.downloadQRCode(profile.id, filename);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyQRData = async () => {
    try {
      await navigator.clipboard.writeText(qrData.qrData);
      toast.success('QR data copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy QR data');
    }
  };

  const isExpired = () => {
    if (!qrData?.expiresAt) return false;
    return new Date(qrData.expiresAt) < new Date();
  };

  const getTimeUntilExpiry = () => {
    if (!qrData?.expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(qrData.expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No profile selected</h3>
        <p className="mt-1 text-sm text-gray-500">Select a profile to manage QR codes</p>
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
    <div className="space-y-6" data-testid="qr-code-manager">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Manager</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage QR codes for eSIM profile activation
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
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-800' :
                  profile.status === 'deployed' ? 'bg-blue-100 text-blue-800' :
                  profile.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Profile ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{profile.id}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading QR code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={fetchQRCode}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          ) : qrData ? (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">QR Code for Profile Activation</h3>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg" data-testid="qr-code-display">
                  <QRCode
                    value={qrData.qrData}
                    size={256}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                
                {/* Expiry Information */}
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <span className={`text-sm ${
                    isExpired() ? 'text-red-600 font-semibold' : 'text-gray-600'
                  }`}>
                    {getTimeUntilExpiry()}
                  </span>
                </div>
                
                {isExpired() && (
                  <div className="mt-2 text-sm text-red-600">
                    This QR code has expired. Generate a new one by refreshing.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadQRCode}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  data-testid="download-qr-button"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download QR Code
                </button>
                
                <button
                  onClick={copyQRData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  data-testid="copy-qr-data-button"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy QR Data
                </button>
                
                <button
                  onClick={fetchQRCode}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh QR Code
                </button>
              </div>

              {/* QR Code Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">QR Code Details</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">QR Code ID:</span>
                    <span className="font-mono text-gray-900">{qrData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-900">
                      {new Date(qrData.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires:</span>
                    <span className="text-gray-900">
                      {new Date(qrData.expiresAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active:</span>
                    <span className={qrData.isActive ? 'text-green-600' : 'text-red-600'}>
                      {qrData.isActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {qrData.scannedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Scanned:</span>
                      <span className="text-gray-900">
                        {new Date(qrData.scannedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Usage Instructions</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Scan this QR code with your device's camera or QR code reader</li>
                  <li>Your device will automatically detect the eSIM activation code</li>
                  <li>Follow your device's prompts to add the eSIM profile</li>
                  <li>Contact your {profile.provider} provider if you experience issues</li>
                </ol>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default QRCodeManager;