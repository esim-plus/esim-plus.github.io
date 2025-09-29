import axios from 'axios';
import toast from 'react-hot-toast';

// Get backend URL from environment
const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 60000, // 60 seconds timeout for enterprise operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getAuthToken = () => {
  return localStorage.getItem('eSIM_auth_token');
};

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('eSIM_auth_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('eSIM_auth_token');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Set token on app initialization
const token = getAuthToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add tenant context if available
    const user = getCurrentUser();
    if (user && user.tenantId) {
      config.headers['X-Tenant-ID'] = user.tenantId;
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API] Response Error:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('eSIM_current_user');
      toast.error('Session expired. Please login again.');
      window.location.reload();
      return Promise.reject(error);
    }
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.detail || data?.message || `Server error: ${status}`;
      toast.error(message);
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error: Unable to connect to server');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// User management functions
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('eSIM_current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('eSIM_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('eSIM_current_user');
  }
};

// Authentication API
export const authAPI = {
  // User login
  async login(credentials) {
    try {
      const response = await api.post('/api/auth/login', null, {
        params: credentials
      });
      
      const { access_token, user } = response.data;
      setAuthToken(access_token);
      setCurrentUser(user);
      
      toast.success(`Welcome back, ${user.fullName}!`);
      return { success: true, user, token: access_token };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // User logout
  async logout() {
    try {
      setAuthToken(null);
      setCurrentUser(null);
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!getAuthToken() && !!getCurrentUser();
  },

  // Check user permissions
  hasPermission(requiredRole) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const roleHierarchy = { admin: 3, operator: 2, viewer: 1 };
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 999;
    
    return userLevel >= requiredLevel;
  }
};

// Enhanced eSIM Profile API functions
export const eSIMAPI = {
  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Create new eSIM profile with enterprise features
  async createProfile(profileData) {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      // Add tenant context
      const enhancedData = {
        ...profileData,
        tenantId: user.tenantId
      };
      
      const response = await api.post('/api/esim/create', enhancedData);
      toast.success('eSIM profile created successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  },

  // Get all eSIM profiles with tenant filtering
  async getProfiles(params = {}) {
    try {
      const { skip = 0, limit = 100, provider } = params;
      let url = `/api/esim/list?skip=${skip}&limit=${limit}`;
      if (provider) url += `&provider=${provider}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      throw error;
    }
  },

  // Get specific eSIM profile by ID
  async getProfile(profileId) {
    try {
      const response = await api.get(`/api/esim/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      throw error;
    }
  },

  // Update eSIM profile
  async updateProfile(profileId, updateData) {
    try {
      const response = await api.put(`/api/esim/update/${profileId}`, updateData);
      toast.success('eSIM profile updated successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Deploy eSIM profile with enhanced tracking
  async deployProfile(deploymentData) {
    try {
      const response = await api.post('/api/esim/deploy', deploymentData);
      
      if (response.data.success) {
        toast.success('eSIM profile deployed successfully!');
      } else {
        toast.error(`Deployment failed: ${response.data.message}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to deploy profile:', error);
      throw error;
    }
  },

  // Delete eSIM profile
  async deleteProfile(profileId) {
    try {
      const response = await api.delete(`/api/esim/${profileId}`);
      toast.success('eSIM profile deleted successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw error;
    }
  },

  // Get operation logs for profile
  async getProfileLogs(profileId, params = {}) {
    try {
      const { skip = 0, limit = 50 } = params;
      const response = await api.get(`/api/esim/logs/${profileId}?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile logs:', error);
      throw error;
    }
  },
};

// QR Code Management API
export const qrCodeAPI = {
  // Get QR code for profile
  async getQRCode(profileId) {
    try {
      const response = await api.get(`/api/qr/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get QR code:', error);
      throw error;
    }
  },

  // Download QR code image
  async downloadQRCode(profileId, filename) {
    try {
      const qrData = await this.getQRCode(profileId);
      if (qrData.success && qrData.qrCode) {
        // Create download link
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${qrData.qrCode.imageBase64}`;
        link.download = filename || `eSIM-QR-${profileId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('QR code downloaded successfully!');
        return { success: true };
      }
      throw new Error('QR code data not available');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw error;
    }
  }
};

// Device Migration API
export const migrationAPI = {
  // Initiate device migration
  async initiateMigration(migrationData) {
    try {
      const response = await api.post('/api/migration/initiate', migrationData);
      toast.success('Device migration initiated successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to initiate migration:', error);
      throw error;
    }
  },

  // Get migration status
  async getMigrationStatus(migrationId) {
    try {
      const response = await api.get(`/api/migration/${migrationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw error;
    }
  }
};

// Tenant Management API (Admin only)
export const tenantAPI = {
  // Create new tenant
  async createTenant(tenantData) {
    try {
      const response = await api.post('/api/tenants/create', tenantData);
      toast.success('Tenant created successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to create tenant:', error);
      throw error;
    }
  },

  // Get all tenants
  async getTenants() {
    try {
      const response = await api.get('/api/tenants/list');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      throw error;
    }
  }
};

// Compliance and Audit API
export const complianceAPI = {
  // Get compliance logs
  async getComplianceLogs(params = {}) {
    try {
      const { skip = 0, limit = 100, operation } = params;
      let url = `/api/compliance/logs?skip=${skip}&limit=${limit}`;
      if (operation) url += `&operation=${operation}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch compliance logs:', error);
      throw error;
    }
  }
};

// Export default api instance for custom requests
export default api;