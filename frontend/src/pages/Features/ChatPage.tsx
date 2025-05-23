// src/pages/Features/ChatPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSetup } from '../../context/SetupContext';
import Navbar from '../../components/Navbar';
import Chatbot from '../../components/Chatbot/Chatbot';
import './ChatPage.css';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { setupState } = useSetup();
  const navigate = useNavigate();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isInfoPanelVisible, setIsInfoPanelVisible] = useState(true);
  const [promptClickDisabled, setPromptClickDisabled] = useState(false);
  
  // Example prompts to help users get started
  const EXAMPLE_PROMPTS = [
    "What are the tuition fees for graduate programs?",
    "How do I apply for financial aid?",
    "Tell me about the admission requirements for international students",
    "What are the application deadlines for Fall 2025?",
    "How can I contact the admissions office?",
    "What documents do I need for my application?",
  ];
  
  // Main resources with links
  const RESOURCES = [
    {
      title: "Admissions Website",
      url: "https://www.iit.edu/admissions-aid",
      icon: "document"
    },
    {
      title: "Financial Aid",
      url: "https://www.iit.edu/financial-aid",
      icon: "dollar"
    },
    {
      title: "Academic Programs",
      url: "https://www.iit.edu/academics/programs",
      icon: "book"
    },
    {
      title: "Student Life",
      url: "https://www.iit.edu/student-affairs/campus-life",
      icon: "user"
    }
  ];

  // Check if setup is complete and previous conversation exists
  useEffect(() => {
    // Check setup state
    const savedSetup = localStorage.getItem('setupState');
    const localSetupState = savedSetup ? JSON.parse(savedSetup) : null;
    const isComplete = setupState?.isComplete || (localSetupState?.isComplete === true);
    
    if (!isComplete) {
      navigate('/setup');
      return;
    }
    
    // Check for existing conversation
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 1) {
          // Skip welcome if there's a previous conversation
          setShowWelcome(false);
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
    
    // On mobile, start with sidebar and info panel collapsed
    if (window.innerWidth <= 768) {
      setIsSidebarVisible(false);
      setIsInfoPanelVisible(false);
    }
    
    setIsLoading(false);
  }, [setupState, navigate]);

  // Handle prompt click with debounce
  const handlePromptClick = (prompt: string) => {
    if (promptClickDisabled) return;
    
    setPromptClickDisabled(true);
    setSelectedPrompt(prompt);
    setShowWelcome(false);
    
    setTimeout(() => {
      setPromptClickDisabled(false);
    }, 1000);
  };

  // Handle starting conversation from welcome screen
  const handleStartConversation = () => {
    setShowWelcome(false);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedPrompt(searchQuery);
      setShowWelcome(false);
      setSearchQuery('');
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  // Toggle info panel visibility
  const toggleInfoPanel = () => {
    setIsInfoPanelVisible(!isInfoPanelVisible);
  };

  // Reset prompt when chat is shown
  const handleChatStart = () => {
    setSelectedPrompt(null);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-block relative w-16 h-16">
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-neutral-200"></div>
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-4 border-t-primary-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-neutral-600 font-medium">Loading your chat assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page bg-neutral-50 min-h-screen flex flex-col">
      <Navbar />
      
      {/* Main layout with toggleable sidebars */}
      <div className="chat-layout flex-1 flex relative">
        {/* Left sidebar toggle button */}
        <button 
          className="sidebar-toggle left-toggle absolute z-10 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-soft text-neutral-600 hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
          style={{ top: '1rem', left: '1rem' }}
          onClick={toggleSidebar}
          aria-label={isSidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Left sidebar */}
        <div className={`left-sidebar w-80 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'} z-20`}>
          <div className="sidebar-header p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-800">AI Enrollment Assistant</h2>
          </div>
          
          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="p-4 border-b border-neutral-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search or ask a question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-all duration-200"
              />
              <button 
                type="submit" 
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400"
                aria-label="Search"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
          
          {/* Example prompts */}
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Popular Questions</h3>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 rounded-lg bg-neutral-50 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 transition-colors duration-200 text-sm"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={promptClickDisabled}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Other features */}
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Other Features</h3>
            <div className="space-y-2">
              {[
                { name: "Email Response", path: "/email-response", icon: "mail" },
                { name: "Document Processing", path: "/document-processing", icon: "document" },
                { name: "Dashboard", path: "/dashboard", icon: "dashboard" }
              ].map((feature, index) => (
                <button
                  key={index}
                  className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors duration-200 text-sm group"
                  onClick={() => navigate(feature.path)}
                >
                  <div className="w-8 h-8 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors duration-200">
                    {feature.icon === "mail" && (
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {feature.icon === "document" && (
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {feature.icon === "dashboard" && (
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    )}
                  </div>
                  <span>{feature.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main chat area */}
        <div className="chat-main flex-1 flex flex-col overflow-hidden">
          {showWelcome ? (
            <div className="welcome-screen flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="max-w-2xl w-full">
                <div className="welcome-icon w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                  AI
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-4">Welcome to AI Enrollment Assistant</h1>
                <p className="text-lg text-neutral-600 mb-8">Your virtual guide for all enrollment and admissions queries at Illinois Institute of Technology</p>
                <button 
                  ref={startButtonRef}
                  onClick={handleStartConversation}
                  className="btn-primary text-lg px-8 py-3 rounded-lg hover-lift mx-auto"
                >
                  Start Conversation
                </button>
                
                <div className="welcome-prompts mt-12">
                  <h2 className="text-xl font-medium text-neutral-800 mb-6">Try asking about:</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {EXAMPLE_PROMPTS.map((prompt, index) => (
                      <button
                        key={index}
                        className="text-left p-4 rounded-lg bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary-300 text-neutral-700"
                    onClick={() => handlePromptClick(prompt)}
                    disabled={promptClickDisabled}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-container flex-1 flex flex-col overflow-hidden">
          <Chatbot 
            initialPrompt={selectedPrompt} 
            onStartConversation={handleChatStart}
          />
        </div>
      )}
    </div>
    
    {/* Right info panel toggle button */}
    <button 
      className="sidebar-toggle right-toggle absolute z-10 flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-soft text-neutral-600 hover:text-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200"
      style={{ top: '1rem', right: '1rem' }}
      onClick={toggleInfoPanel}
      aria-label={isInfoPanelVisible ? "Hide information" : "Show information"}
    >
      <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    
    {/* Right info panel */}
    <div className={`right-panel w-80 bg-white border-l border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out ${isInfoPanelVisible ? 'translate-x-0' : 'translate-x-full'} z-20`}>
      <div className="panel-header p-6 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800">Resources</h2>
      </div>
      
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Helpful Links</h3>
        <ul className="space-y-2">
          {RESOURCES.map((resource, index) => (
            <li key={index}>
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors duration-200">
                  {resource.icon === "document" && (
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {resource.icon === "dollar" && (
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {resource.icon === "book" && (
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {resource.icon === "user" && (
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{resource.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">About</h3>
        <p className="text-sm text-neutral-600 leading-relaxed">
          This AI assistant is designed to help with questions related to admissions, programs, 
          tuition, and student life at Illinois Institute of Technology. The information provided 
          is based on current university policies and procedures.
        </p>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Need Help?</h3>
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <p className="text-sm text-neutral-600 mb-3">
            If you need additional assistance, please contact our admissions office:
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-neutral-800">admission@iit.edu</span>
            </div>
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium text-neutral-800">(312) 567-3025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

);
};
export default ChatPage;