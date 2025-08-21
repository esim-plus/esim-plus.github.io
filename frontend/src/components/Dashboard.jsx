import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ListBulletIcon, 
  RocketLaunchIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { eSIMAPI } from '../services/api';
import { formatRelativeTime, getStatusClasses } from '../utils/helpers';
import toast from 'react-hot-toast';

const Dashboard = ({ onViewChange }) => {
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    deployed: 0,
    active: 0,
    error: 0
  });
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
    checkHealth();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await eSIMAPI.getProfiles(0, 100);
      
      if (response.success) {
        const profiles = response.profiles;
        
        // Calculate stats
        const newStats = {
          total: profiles.length,
          created: profiles.filter(p => p.status === 'created').length,
          deployed: profiles.filter(p => p.status === 'deployed').length,
          active: profiles.filter(p => p.status === 'active').length,
          error: profiles.filter(p => p.status === 'error').length
        };
        
        setStats(newStats);
        setRecentProfiles(profiles.slice(0, 5)); // Show latest 5
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await eSIMAPI.healthCheck();
      setHealthStatus(health);
    } catch (error) {
      setHealthStatus({ status: 'unhealthy', error: error.message });
    }
  };

  const quickActions = [
    {
      title: 'Create New Profile',
      description: 'Add a new eSIM profile for deployment',
      icon: PlusIcon,
      action: () => onViewChange('create'),
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'View All Profiles',
      description: 'Browse and manage existing profiles',
      icon: ListBulletIcon,
      action: () => onViewChange('list'),
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Profiles',
      value: stats.total,
      icon: ChartBarIcon,
      color: 'bg-primary-500',
      textColor: 'text-primary-600'
    },
    {
      title: 'Created',
      value: stats.created,
      icon: PlusIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Deployed',
      value: stats.deployed,
      icon: RocketLaunchIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: CheckCircleIcon,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Errors',
      value: stats.error,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8 text-primary-500"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient mb-4">
          eSIM Management Dashboard
        </h1>
        <p className="text-gray-600 text-lg">
          Manage ATOM, Ooredoo, Mytel, and MPT eSIM profiles
        </p>
        
        {/* Health Status */}
        <div className="mt-4 flex items-center justify-center">
          {healthStatus?.status === 'healthy' ? (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">System Healthy</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">System Issues Detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="stat-card hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={action.title}
              className="card-hover hover-lift animate-bounce-in"
              style={{ animationDelay: `${index * 200}ms` }}
              onClick={action.action}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-semibold ${action.textColor} mb-2`}>
                    {action.title}
                  </h3>
                  <p className="text-gray-600">{action.description}</p>
                  <div className="mt-4">
                    <span className={`inline-flex items-center text-sm font-medium ${action.textColor}`}>
                      Get started
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Profiles */}
      <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Profiles</h2>
          <button
            onClick={() => onViewChange('list')}
            className="btn-secondary text-sm"
          >
            View All
          </button>
        </div>
        
        {recentProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ListBulletIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
            <p className="text-gray-600 mb-4">Create your first eSIM profile to get started</p>
            <button
              onClick={() => onViewChange('create')}
              className="btn-primary"
            >
              Create Profile
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProfiles.map((profile, index) => (
              <div 
                key={profile.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-12 rounded-full ${profile.provider === 'ATOM' ? 'bg-green-500' : profile.provider === 'Ooredoo' ? 'bg-red-500' : profile.provider === 'Mytel' ? 'bg-yellow-500' : 'bg-purple-500'}`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{profile.displayName}</h4>
                    <p className="text-sm text-gray-600">{profile.provider}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={getStatusClasses(profile.status)}>
                    {profile.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(profile.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;