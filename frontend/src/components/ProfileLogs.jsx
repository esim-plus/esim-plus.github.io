import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { formatDate, formatRelativeTime, getOperationIcon } from '../utils/helpers';
import toast from 'react-hot-toast';

const ProfileLogs = ({ profile, onViewChange }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    if (profile) {
      loadLogs();
    }
  }, [profile, currentPage]);

  const loadLogs = async (showRefreshSpinner = false) => {
    if (!profile) return;
    
    try {
      if (showRefreshSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await eSIMAPI.getProfileLogs(profile.id, skip, itemsPerPage);
      
      if (response.success) {
        setLogs(response.logs);
        setTotalLogs(response.total);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadLogs(true);
  };

  const handleCancel = () => {
    onViewChange('list');
  };

  const getLogStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  if (!profile) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Selected</h2>
          <p className="text-gray-600 mb-4">Please select a profile to view logs.</p>
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8 text-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading logs...</span>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Logs</h1>
            <p className="text-gray-600">
              Operation history for "{profile.displayName}" ({totalLogs} entries)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className={`btn-secondary flex items-center space-x-2 ${refreshing ? 'opacity-50' : ''}`}
            disabled={refreshing}
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Profile Name</h4>
            <p className="text-gray-900">{profile.displayName}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Provider</h4>
            <p className="text-gray-900">{profile.provider}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Current Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${profile.status === 'active' ? 'bg-green-100 text-green-800' : profile.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
              {profile.status}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Profile ID</h4>
            <p className="text-gray-900 font-mono text-sm truncate">{profile.id}</p>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="card">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Logs Found</h3>
            <p className="text-gray-600 mb-4">
              No operations have been logged for this profile yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flow-root">
              <ul className="-mb-8">
                {logs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== logs.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white text-xs ${getLogStatusColor(log.status)}`}>
                            {getOperationIcon(log.operation)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-gray-900 capitalize">
                                {log.operation}
                              </span>{' '}
                              operation{' '}
                              <span className={`font-medium ${log.status === 'success' ? 'text-green-600' : log.status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                                {log.status}
                              </span>
                            </p>
                            
                            {/* Log Details */}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-2">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Details:</h5>
                                  <dl className="space-y-1">
                                    {Object.entries(log.details).map(([key, value]) => {
                                      if (key === 'powershell_result' && typeof value === 'object') {
                                        return (
                                          <div key={key}>
                                            <dt className="text-xs font-medium text-gray-600">PowerShell Result:</dt>
                                            <dd className="text-xs text-gray-800">
                                              {value.success ? 'Success' : 'Failed'}
                                              {value.stdout && (
                                                <pre className="mt-1 p-2 bg-gray-200 rounded text-xs overflow-x-auto">
                                                  {value.stdout}
                                                </pre>
                                              )}
                                              {value.stderr && (
                                                <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                                                  {value.stderr}
                                                </pre>
                                              )}
                                            </dd>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div key={key} className="flex justify-between">
                                          <dt className="text-xs font-medium text-gray-600 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                          </dt>
                                          <dd className="text-xs text-gray-800">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          </dd>
                                        </div>
                                      );
                                    })}
                                  </dl>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <time dateTime={log.timestamp}>
                                {formatRelativeTime(log.timestamp)}
                              </time>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(log.timestamp, 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 mt-6">
                <div className="flex items-center text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs} logs
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileLogs;