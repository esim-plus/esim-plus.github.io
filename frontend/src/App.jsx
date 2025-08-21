import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CreateProfile from './components/CreateProfile';
import ListProfiles from './components/ListProfiles';
import UpdateProfile from './components/UpdateProfile';
import DeployProfile from './components/DeployProfile';
import ProfileLogs from './components/ProfileLogs';
import BackgroundAnimation from './components/BackgroundAnimation';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Handle view navigation
  const handleViewChange = (view, profile = null) => {
    setCurrentView(view);
    setSelectedProfile(profile);
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'create':
        return <CreateProfile onViewChange={handleViewChange} />;
      case 'list':
        return <ListProfiles onViewChange={handleViewChange} />;
      case 'update':
        return <UpdateProfile profile={selectedProfile} onViewChange={handleViewChange} />;
      case 'deploy':
        return <DeployProfile profile={selectedProfile} onViewChange={handleViewChange} />;
      case 'logs':
        return <ProfileLogs profile={selectedProfile} onViewChange={handleViewChange} />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Animation */}
      <BackgroundAnimation />
      
      {/* Main Application */}
      <div className="relative z-10">
        {/* Navigation */}
        <Navbar currentView={currentView} onViewChange={handleViewChange} />
        
        {/* Main Content */}
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderCurrentView()}
          </div>
        </main>
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
            theme: {
              primary: '#2e70e5',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
}

export default App;