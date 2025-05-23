// frontend/src/pages/Features/EmailResponse/FeaturesSidebar.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeaturesSidebar: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Chat Assistant",
      description: "Get instant answers to all your enrollment queries with our AI assistant.",
      icon: "chat",
      path: "/chat"
    },
    {
      title: "Document Processing",
      description: "Analyze student documents and extract key information automatically.",
      icon: "document",
      path: "/document-processing"
    },
    {
      title: "Dashboard",
      description: "Return to the main dashboard for an overview of all features.",
      icon: "dashboard",
      path: "/dashboard"
    }
  ];

  // Icon components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'chat':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="features-sidebar-container">
      <div className="sidebar-header">
        <h2>Features</h2>
      </div>
      
      <div className="sidebar-section">
        <h3>Explore Our Tools</h3>
        <p className="text-sm text-gray-600 mb-4">
          Discover the powerful tools available to enhance your enrollment process.
        </p>
        
        <div className="feature-cards">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              onClick={() => navigate(feature.path)}
            >
              <div className="feature-icon">
                {getIconComponent(feature.icon)}
              </div>
              <div className="feature-content">
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sidebar-section">
        <h3>Need Help?</h3>
        <p className="text-sm text-gray-600">
          This page allows you to manage the knowledge base that powers your email responses. Add custom answers to common questions to improve automation quality.
        </p>
        <div className="mt-4">
          <a 
            href="#" 
            className="text-blue-600 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View documentation
          </a>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSidebar;