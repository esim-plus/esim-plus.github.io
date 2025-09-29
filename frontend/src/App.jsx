import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authAPI, getCurrentUser } from './services/api';

// Components
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CreateProfile from './components/CreateProfile';
import ListProfiles from './components/ListProfiles';
import UpdateProfile from './components/UpdateProfile';
import DeployProfile from './components/DeployProfile';
import ProfileLogs from './components/ProfileLogs';
import QRCodeManager from './components/QRCodeManager';
import DeviceMigration from './components/DeviceMigration';
import ComplianceDashboard from './components/ComplianceDashboard';
import TenantManagement from './components/TenantManagement';
import LoginForm from './components/LoginForm';
import BackgroundAnimation from './components/BackgroundAnimation';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authAPI.isAuthenticated();
      const user = getCurrentUser();
      
      setIsAuthenticated(authenticated);
      setCurrentUser(user);
      setIsLoading(false);
      
      // Redirect to dashboard if authenticated
      if (authenticated && user) {
        setCurrentView('dashboard');
      }
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentView('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle view navigation with permission checking
  const handleViewChange = (view, profile = null) => {
    // Check permissions for restricted views
    const restrictedViews = {
      'tenant-management': 'admin',
      'compliance': 'admin',
      'create': 'operator',
      'deploy': 'operator',
      'migration': 'operator'
    };

    const requiredRole = restrictedViews[view];
    if (requiredRole && !authAPI.hasPermission(requiredRole)) {
      // Show permission denied or redirect to dashboard
      setCurrentView('dashboard');
      return;
    }

    setCurrentView(view);
    setSelectedProfile(profile);
  };

  // Render current view with RBAC enforcement
  const renderCurrentView = () => {
    if (!isAuthenticated) {
      return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'create':
        return authAPI.hasPermission('operator') ? 
          <CreateProfile onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'list':
        return <ListProfiles onViewChange={handleViewChange} user={currentUser} />;
      case 'update':
        return authAPI.hasPermission('operator') ? 
          <UpdateProfile profile={selectedProfile} onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'deploy':
        return authAPI.hasPermission('operator') ? 
          <DeployProfile profile={selectedProfile} onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'logs':
        return <ProfileLogs profile={selectedProfile} onViewChange={handleViewChange} user={currentUser} />;
      case 'qr-codes':
        return <QRCodeManager profile={selectedProfile} onViewChange={handleViewChange} user={currentUser} />;
      case 'migration':
        return authAPI.hasPermission('operator') ? 
          <DeviceMigration profile={selectedProfile} onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'compliance':
        return authAPI.hasPermission('admin') ? 
          <ComplianceDashboard onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      case 'tenant-management':
        return authAPI.hasPermission('admin') ? 
          <TenantManagement onViewChange={handleViewChange} user={currentUser} /> :
          <Dashboard onViewChange={handleViewChange} user={currentUser} />;
      default:
        return <Dashboard onViewChange={handleViewChange} user={currentUser} />;
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading eSIM Plus Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Animation */}
      <BackgroundAnimation />
      
      {/* Main Application */}
      <div className="relative z-10">
        {/* Navigation - only show when authenticated */}
        {isAuthenticated && (
          <Navbar 
            currentView={currentView} 
            onViewChange={handleViewChange}
            user={currentUser}
            onLogout={handleLogout}
          />
        )}
        
        {/* Main Content */}
        <main className={isAuthenticated ? "pt-16" : ""}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderCurrentView()}
          </div>
        </main>

        {/* Footer - show tenant and system info */}
        {isAuthenticated && currentUser && (
          <footer className="bg-white border-t border-gray-200 py-4 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Tenant: {currentUser.tenantId}</span>
                  <span>Role: {currentUser.role}</span>
                  <span>User: {currentUser.fullName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>eSIM Plus Management System v2.0</span>
                  <span>Providers: MPT, ATOM, OOREDOO, MYTEL</span>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
              color: '#fff',
            }
          }
        }}
      />
    </div>
  );
}

export default App;