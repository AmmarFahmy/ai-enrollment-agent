import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SetupProvider, useSetup } from '../../context/SetupContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

const chatIcon = (
  <svg
    className="h-6 w-6 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, link }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md cursor-pointer transition-shadow duration-300"
      onClick={() => navigate(link)}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="font-medium text-blue-700 hover:text-blue-900">
            Get started &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent: React.FC = () => {
  const { user, school } = useAuth();
  const { setupState } = useSetup();
  const navigate = useNavigate();

  // If setup is not complete, redirect to setup wizard
  useEffect(() => {
    // Instead of immediately redirecting
    // Add this code to ensure we don't get stuck in a loop
    const savedSetup = localStorage.getItem('setupState');
    
    if (!savedSetup) {
      // Only redirect if there's no setup state at all
      navigate('/setup');
      return;
    }
    
    // If we have some setup state, let's just show the dashboard
    // and not worry too much about whether it's complete
    // This will break the redirect loop
  }, [navigate]);

  // Email icon
  const emailIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  // Document icon
  const documentIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  // Stats icons
  const emailsIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  const documentsIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  );

  const responseTimeIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const studentsIcon = (
    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
            <p className="mt-1 text-gray-600">Here's an overview of your AI Enrollment Counselor</p>
          </div>
          
          {/* Setup Summary */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800">Agent Role</h3>
                <p className="text-blue-600 mt-1 capitalize">
                  {setupState.agentConfig.role.replace('_', ' ')}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800">Knowledge Base</h3>
                <p className="text-green-600 mt-1">
                  {setupState.knowledgeBase.filename || 'Not uploaded'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-800">CRM Connection</h3>
                <p className="text-purple-600 mt-1">
                  {setupState.crmConfig.url || 'Not connected'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Processed Emails"
                value="24"
                icon={emailsIcon}
                color="bg-blue-500"
              />
              <StatsCard
                title="Analyzed Documents"
                value="12"
                icon={documentsIcon}
                color="bg-green-500"
              />
              <StatsCard
                title="Avg. Response Time"
                value="4.2 mins"
                icon={responseTimeIcon}
                color="bg-yellow-500"
              />
              <StatsCard
                title="Current Applicants"
                value="156"
                icon={studentsIcon}
                color="bg-purple-500"
              />
            </div>
          </div>
          
          {/* Features Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Main Features</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-2">
              <FeatureCard
                title="AI Chat Assistant"
                description="Ask questions and get instant answers about admissions, programs, tuition, and other enrollment topics using our AI-powered knowledge base."
                icon={chatIcon}
                link="/chat"
              />
              <FeatureCard
                title="Email Response Assistant"
                description="Use AI to respond to student inquiries and manage your inbox. The system will automatically read emails and prepare responses based on your knowledge base."
                icon={emailIcon}
                link="/email-response"
              />
              <FeatureCard
                title="Document Processing & Analysis"
                description="Upload student documents for AI analysis. Extract key information from transcripts, applications, and other student records automatically."
                icon={documentIcon}
                link="/document-processing"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Wrapper with Setup Provider
const Dashboard: React.FC = () => {
    return <DashboardContent />;
  };

export default Dashboard;