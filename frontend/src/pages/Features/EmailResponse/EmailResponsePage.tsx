// frontend/src/pages/Features/EmailResponse/EmailResponsePage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSetup } from '../../../context/SetupContext';
import Navbar from '../../../components/Navbar';
import KnowledgeSidebar from '../EmailResponse/KnowledgeSidebar';
import EmailSidebar from '../EmailResponse/EmailSidebar';
import FeaturesSidebar from '../EmailResponse/FeaturesSidebar';
import './EmailResponsePage.css';

const EmailResponsePage: React.FC = () => {
  const { user } = useAuth();
  const { setupState } = useSetup();
  const navigate = useNavigate();
  
  // States for sidebar visibility
  const [isLeftSidebarVisible, setIsLeftSidebarVisible] = useState(true);
  const [isRightSidebarVisible, setIsRightSidebarVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if setup is complete
  useEffect(() => {
    // Get setup state directly from localStorage to avoid context issues
    const savedSetup = localStorage.getItem('setupState');
    
    if (savedSetup) {
      try {
        const setupData = JSON.parse(savedSetup);
        // Only redirect if explicitly not complete
        if (setupData.isComplete !== true) {
          console.log('Redirecting to setup because isComplete is not true:', setupData);
          navigate('/setup');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error parsing setup state:', error);
        setIsLoading(false);
      }
    } else {
      // No setup state found
      console.log('No setup state found, redirecting to setup');
      navigate('/setup');
    }
    
    // On mobile, start with sidebars collapsed
    if (window.innerWidth <= 768) {
      setIsLeftSidebarVisible(false);
      setIsRightSidebarVisible(false);
    }
  }, [navigate]);
  
  // Toggle left sidebar visibility
  const toggleLeftSidebar = () => {
    setIsLeftSidebarVisible(!isLeftSidebarVisible);
  };
  
  // Toggle right sidebar visibility
  const toggleRightSidebar = () => {
    setIsRightSidebarVisible(!isRightSidebarVisible);
  };
  
  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading knowledge management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-response-page">
      <Navbar />
      
      <div className="email-layout">
        {/* Left sidebar toggle button */}
        <button 
          className="sidebar-toggle left-toggle"
          onClick={toggleLeftSidebar}
          aria-label={isLeftSidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Left sidebar for features promotion */}
        <div className={`left-sidebar ${isLeftSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
          <FeaturesSidebar />
        </div>
        
        {/* Main content area - Knowledge Base */}
        <div className="email-main">
          <KnowledgeSidebar />
        </div>
        
        {/* Right sidebar toggle button */}
        <button 
          className="sidebar-toggle right-toggle"
          onClick={toggleRightSidebar}
          aria-label={isRightSidebarVisible ? "Hide automated tools" : "Show automated tools"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {/* Right sidebar for automated tools */}
        <div className={`right-sidebar ${isRightSidebarVisible ? 'sidebar-visible' : 'sidebar-hidden'}`}>
          <EmailSidebar />
        </div>
      </div>
    </div>
  );
};

export default EmailResponsePage;