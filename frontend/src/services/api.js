import axios from 'axios';
import toast from 'react-hot-toast';

// Get backend URL from environment
const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
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

// eSIM Profile API functions
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

  // Create new eSIM profile
  async createProfile(profileData) {
    try {
      const response = await api.post('/api/esim/create', profileData);
      toast.success('eSIM profile created successfully!');
      return response.data;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  },

  // Get all eSIM profiles with pagination
  async getProfiles(skip = 0, limit = 100) {
    try {
      const response = await api.get(`/api/esim/list?skip=${skip}&limit=${limit}`);
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

  // Deploy eSIM profile
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
  async getProfileLogs(profileId, skip = 0, limit = 50) {
    try {
      const response = await api.get(`/api/esim/logs/${profileId}?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile logs:', error);
      throw error;
    }
  },
};

// Export default api instance for custom requests
export default api;