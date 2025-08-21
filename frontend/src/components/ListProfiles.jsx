import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  RocketLaunchIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { 
  formatDate, 
  formatRelativeTime, 
  getStatusClasses, 
  getProviderClasses,
  truncateText,
  PROVIDERS,
  STATUS_OPTIONS
} from '../utils/helpers';
import toast from 'react-hot-toast';

const ListProfiles = ({ onViewChange }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedProfiles, setSelectedProfiles] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, [currentPage]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await eSIMAPI.getProfiles(skip, itemsPerPage);
      
      if (response.success) {
        setProfiles(response.profiles);
        setTotalProfiles(response.total);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId, profileName) => {
    if (!window.confirm(`Are you sure you want to delete "${profileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await eSIMAPI.deleteProfile(profileId);
      loadProfiles(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProfiles.length === 0) {
      toast.error('Please select profiles to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedProfiles.length} selected profiles? This action cannot be undone.`)) {
      return;
    }

    try {
      const deletePromises = selectedProfiles.map(profileId => 
        eSIMAPI.deleteProfile(profileId)
      );
      
      await Promise.all(deletePromises);
      setSelectedProfiles([]);
      loadProfiles();
      toast.success(`${selectedProfiles.length} profiles deleted successfully`);
    } catch (error) {
      console.error('Failed to delete profiles:', error);
      toast.error('Failed to delete some profiles');
    }
  };

  const toggleProfileSelection = (profileId) => {
    setSelectedProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.length === filteredProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(filteredProfiles.map(p => p.id));
    }
  };

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = !filterProvider || profile.provider === filterProvider;
    const matchesStatus = !filterStatus || profile.status === filterStatus;
    
    return matchesSearch && matchesProvider && matchesStatus;
  });

  const totalPages = Math.ceil(totalProfiles / itemsPerPage);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8 text-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading profiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onViewChange('dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">eSIM Profiles</h1>
            <p className="text-gray-600">
              Manage your eSIM profiles ({totalProfiles} total)
            </p>
          </div>
          <button
            onClick={() => onViewChange('create')}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Profile</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="input-field"
            >
              <option value="">All Providers</option>
              {PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center space-x-2">
            {selectedProfiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm flex items-center space-x-1"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete ({selectedProfiles.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profiles List */}
      <div className="card">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {profiles.length === 0 ? 'No profiles found' : 'No matching profiles'}
            </h3>
            <p className="text-gray-600 mb-4">
              {profiles.length === 0 
                ? 'Create your first eSIM profile to get started'
                : 'Try adjusting your search criteria'
              }
            </p>
            {profiles.length === 0 && (
              <button
                onClick={() => onViewChange('create')}
                className="btn-primary"
              >
                Create Profile
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Profile</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Provider</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProfiles.map((profile, index) => (
                    <tr 
                      key={profile.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={() => toggleProfileSelection(profile.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className={`border-l-4 pl-3 ${getProviderClasses(profile.provider)}`}>
                          <div className="font-medium text-gray-900">
                            {profile.displayName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {truncateText(profile.description || 'No description', 50)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {profile.provider}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={getStatusClasses(profile.status)}>
                          {profile.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(profile.createdAt, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatRelativeTime(profile.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewChange('update', profile)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                            title="Edit Profile"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewChange('deploy', profile)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                            title="Deploy Profile"
                          >
                            <RocketLaunchIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewChange('logs', profile)}
                            className="p-1 text-gray-400 hover:text-purple-600 transition-colors duration-200"
                            title="View Logs"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id, profile.displayName)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete Profile"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalProfiles)} of {totalProfiles} profiles
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

export default ListProfiles;