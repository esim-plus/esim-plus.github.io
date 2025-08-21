import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date, formatString = 'PPp') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Invalid date';
  }
};

/**
 * Get status badge classes based on status
 */
export const getStatusClasses = (status) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide';
  
  switch (status?.toLowerCase()) {
    case 'created':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'deployed':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'active':
      return `${baseClasses} bg-emerald-100 text-emerald-800`;
    case 'inactive':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'error':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'deploying':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

/**
 * Get provider-specific styling
 */
export const getProviderClasses = (provider) => {
  switch (provider?.toLowerCase()) {
    case 'atom':
      return 'border-l-4 border-green-500';
    case 'ooredoo':
      return 'border-l-4 border-red-500';
    case 'mytel':
      return 'border-l-4 border-yellow-500';
    case 'mpt':
      return 'border-l-4 border-purple-500';
    default:
      return 'border-l-4 border-gray-300';
  }
};

/**
 * Get provider color
 */
export const getProviderColor = (provider) => {
  switch (provider?.toLowerCase()) {
    case 'atom':
      return '#10b981';
    case 'ooredoo':
      return '#ef4444';
    case 'mytel':
      return '#f59e0b';
    case 'mpt':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
};

/**
 * Validate eSIM profile data
 */
export const validateProfile = (profile) => {
  const errors = {};
  
  if (!profile.displayName?.trim()) {
    errors.displayName = 'Display name is required';
  } else if (profile.displayName.length > 100) {
    errors.displayName = 'Display name must be less than 100 characters';
  }
  
  if (!profile.activationCode?.trim()) {
    errors.activationCode = 'Activation code is required';
  }
  
  if (!profile.smdpServerUrl?.trim()) {
    errors.smdpServerUrl = 'SMDP server URL is required';
  } else if (!isValidUrl(profile.smdpServerUrl)) {
    errors.smdpServerUrl = 'Please enter a valid URL';
  }
  
  if (!profile.provider) {
    errors.provider = 'Provider is required';
  }
  
  if (profile.description && profile.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Check if string is valid URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get operation icon based on operation type
 */
export const getOperationIcon = (operation) => {
  switch (operation?.toLowerCase()) {
    case 'create':
      return '✨';
    case 'update':
      return '✏️';
    case 'deploy':
      return '🚀';
    case 'delete':
      return '🗑️';
    default:
      return '📝';
  }
};

/**
 * Constants
 */
export const PROVIDERS = [
  { value: 'ATOM', label: 'ATOM' },
  { value: 'Ooredoo', label: 'Ooredoo' },
  { value: 'Mytel', label: 'Mytel' },
  { value: 'MPT', label: 'MPT' }
];

export const STATUS_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'error', label: 'Error' }
];

export const ITEMS_PER_PAGE = 10;