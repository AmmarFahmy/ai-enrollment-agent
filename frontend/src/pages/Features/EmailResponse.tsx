import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSetup } from '../../context/SetupContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// Message type definition
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Email Response Component
const EmailResponse: React.FC = () => {
  const { user } = useAuth();
  const { setupState } = useSetup();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI Enrollment Counselor. I can help you draft email responses to student inquiries. Simply paste the email content or provide details, and I\'ll help you craft a response.',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [emailLink, setEmailLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoEmailCount, setAutoEmailCount] = useState<number>(5);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [autoProcessInput, setAutoProcessInput] = useState<string>('');
  const [isBrowserRunning, setIsBrowserRunning] = useState(false);
  
  // Check if setup is complete
  useEffect(() => {
    const savedSetup = localStorage.getItem('setupState');
    const localSetupState = savedSetup ? JSON.parse(savedSetup) : null;
    
    const isComplete = setupState?.isComplete || (localSetupState?.isComplete === true);
    
    if (!isComplete) {
      navigate('/setup');
    }
  }, [setupState, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    // Simulate AI response after delay
    setTimeout(() => {
      generateAIResponse(inputValue);
      setIsProcessing(false);
    }, 1500);
  };

  // Copy message content to clipboard
  const copyToClipboard = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    });
  };

  // Generate AI response based on user input
  const generateAIResponse = (userInput: string) => {
    let aiResponse = '';
    
    // Check if it looks like an email (contains @ or common email keywords)
    if (userInput.includes('@') || 
        userInput.toLowerCase().includes('dear') || 
        userInput.toLowerCase().includes('hello') ||
        userInput.toLowerCase().includes('hi,')) {
      // Looks like an email, generate a response
      aiResponse = `Here's a draft response to this email:

Dear Student,

Thank you for reaching out to our enrollment office. I appreciate your interest in our programs.

${userInput.includes('application') ? 
  'Regarding your application status, I have checked our system and can confirm we have received all your documents. Your application is currently under review by our admissions committee, and you should receive a decision within the next 2-3 weeks.' : 
  ''}

${userInput.includes('financial') || userInput.includes('scholarship') ? 
  'As for your financial aid inquiry, I recommend completing the FAFSA as soon as possible if you haven\'t already. Additionally, you may be eligible for our merit-based scholarships, which are awarded based on academic achievement.' : 
  ''}

${userInput.includes('deadline') ? 
  'The application deadline for the upcoming semester is May 15th. Please ensure all required documents are submitted by this date to be considered for admission.' : 
  ''}

${userInput.includes('requirements') ? 
  'Our program requirements include a minimum GPA of 3.0, completion of prerequisite courses, and submission of official transcripts from all previously attended institutions.' : 
  ''}

Please let me know if you have any other questions or need further assistance. We're here to help you through the enrollment process.

Best regards,
Enrollment Counselor
`;
    } else if (userInput.toLowerCase().includes('generate') || 
               userInput.toLowerCase().includes('draft') || 
               userInput.toLowerCase().includes('write')) {
      // User is asking to generate a specific response
      aiResponse = `Here's a draft message for you:

Dear Prospective Student,

Thank you for your interest in our university's programs. We're delighted that you're considering joining our academic community.

We offer a wide range of undergraduate and graduate programs designed to prepare students for successful careers and meaningful contributions to society. Our faculty are leaders in their fields and committed to providing an exceptional educational experience.

If you have specific questions about admission requirements, application deadlines, financial aid opportunities, or any other aspects of our programs, please don't hesitate to ask. I'm here to provide you with all the information you need to make an informed decision about your educational journey.

I look forward to assisting you further.

Best regards,
Enrollment Counselor
`;
    } else {
      // General query or instruction
      aiResponse = `I understand you'd like assistance with: "${userInput}"

I'd be happy to help draft a response or provide information on this topic. Could you provide more details or perhaps share the original email you received? This would help me create a more tailored and appropriate response.

If you're looking for specific information about admissions, programs, financial aid, or other enrollment topics, please let me know and I can focus my assistance accordingly.`;
    }
    
    const newAIMessage: Message = {
      id: `ai-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newAIMessage]);
  };

  // Handle email link submission with browser-use integration
  const handleEmailLinkSubmit = async () => {
    if (!emailLink.trim() || isBrowserRunning) return;
    
    // Set browser running state
    setIsBrowserRunning(true);
    
    // Status message
    const initMessage: Message = {
      id: `system-${Date.now()}`,
      content: `Initializing browser to process email at: ${emailLink}\n\nThis will open Chrome and navigate to the URL to process the email automatically.`,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, initMessage]);
    
    try {
      // Call the backend API to start browser-use script
      const response = await fetch('http://localhost:8000/api/process-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          slate_url: emailLink 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success message
        const successMessage: Message = {
          id: `system-${Date.now() + 1}`,
          content: `✓ Successfully processed the email!\n\n${data.message}`,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, successMessage]);
      } else {
        // Error message
        const errorMessage: Message = {
          id: `system-${Date.now() + 1}`,
          content: `❌ Error: ${data.error || 'Failed to process the email.'}`,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error calling browser-use API:', error);
      
      // Error message for network/server issues
      const errorMessage: Message = {
        id: `system-${Date.now() + 1}`,
        content: `❌ Error: Could not connect to the browser-use service. Please make sure the backend server is running.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsBrowserRunning(false);
      setEmailLink('');
    }
  };

  // Handle direct number input for auto-processing
  const handleDirectAutoProcess = () => {
    if (!autoProcessInput || isNaN(parseInt(autoProcessInput))) return;
    
    const count = parseInt(autoProcessInput);
    if (count <= 0) return;
    
    // Add message about automated email processing
    const message: Message = {
      id: `system-${Date.now()}`,
      content: `You've initiated automated processing of ${count} emails. In a production environment, this would sequentially process emails from your inbox.`,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, message]);
    
    // Show processing simulation
    setIsProcessing(true);
    
    setTimeout(() => {
      const completionMessage: Message = {
        id: `system-${Date.now() + 1}`,
        content: `✓ Successfully processed ${count} emails! All responses have been drafted and are ready for your review in the CRM system.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setIsProcessing(false);
      setAutoProcessInput('');
    }, 3000);
  };

  // Handle processing multiple emails automatically via modal
  const handleAutoEmails = () => {
    setShowAutoModal(false);
    
    // Add message about automated email processing
    const message: Message = {
      id: `system-${Date.now()}`,
      content: `You've initiated automated processing of ${autoEmailCount} emails. In a production environment, this would sequentially process emails from your inbox.`,
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, message]);
    
    // Show processing simulation
    setIsProcessing(true);
    
    setTimeout(() => {
      const completionMessage: Message = {
        id: `system-${Date.now() + 1}`,
        content: `✓ Successfully processed ${autoEmailCount} emails! All responses have been drafted and are ready for your review in the CRM system.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, completionMessage]);
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-800">AI Email Response Assistant</h1>
            <p className="text-sm text-gray-600">
              Draft email responses with AI assistance or process emails directly from your CRM
            </p>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 max-w-3xl ${
                      message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div 
                      className={`rounded-lg p-4 ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <pre className={`whitespace-pre-wrap font-sans ${
                          message.sender === 'user' ? 'text-white' : 'text-gray-800'
                        } flex-1`}>
                          {message.content}
                        </pre>
                        
                        {/* Copy button (only for AI messages) */}
                        {message.sender === 'ai' && (
                          <button 
                            onClick={() => copyToClipboard(message.id, message.content)}
                            className="ml-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedMessageId === message.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div 
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-right' : ''
                      }`}
                    >
                      {message.sender === 'user' ? 'You' : 'AI Assistant'} • {
                        message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <div className="dot-typing mr-2"></div>
                    AI is thinking...
                  </div>
                )}
                {isBrowserRunning && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <div className="dot-typing mr-2"></div>
                    Browser is running... Please wait while we process the email.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Paste email content or enter your query..."
                    className="flex-1 resize-none border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent p-3"
                    rows={3}
                    disabled={isBrowserRunning}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isProcessing || !inputValue.trim() || isBrowserRunning}
                    className={`bg-blue-600 text-white px-4 rounded-r-lg ${
                      isProcessing || !inputValue.trim() || isBrowserRunning
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
            
            {/* CRM Tools Sidebar */}
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">CRM Tools</h2>
                
                {/* Process Specific Email */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Process Specific Email</h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={emailLink}
                      onChange={(e) => setEmailLink(e.target.value)}
                      placeholder="Enter Slate URL..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isBrowserRunning}
                    />
                    <button
                      onClick={handleEmailLinkSubmit}
                      disabled={!emailLink.trim() || isBrowserRunning}
                      className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md ${
                        !emailLink.trim() || isBrowserRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {isBrowserRunning ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : 'Process Email'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Slate URL to access and process an email with browser-use
                  </p>
                </div>
                
                {/* Automation Tools */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Automation Tools</h3>
                  
                  {/* Direct number input for auto-processing */}
                  <div className="mb-3">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={autoProcessInput}
                        onChange={(e) => setAutoProcessInput(e.target.value)}
                        placeholder="Number of emails"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isBrowserRunning}
                      />
                      <button
                        onClick={handleDirectAutoProcess}
                        disabled={!autoProcessInput || isNaN(parseInt(autoProcessInput)) || parseInt(autoProcessInput) <= 0 || isBrowserRunning}
                        className={`bg-green-600 text-white px-3 py-2 rounded-md ${
                          !autoProcessInput || isNaN(parseInt(autoProcessInput)) || parseInt(autoProcessInput) <= 0 || isBrowserRunning
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-green-700'
                        }`}
                      >
                        Go
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the number of emails to process automatically
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowAutoModal(true)}
                    disabled={isBrowserRunning}
                    className={`w-full bg-green-600 text-white py-2 px-4 rounded-md ${
                      isBrowserRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                    }`}
                  >
                    Advanced Auto-Process
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure automated processing with additional options
                  </p>
                </div>
                
                {/* Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Today's Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Emails Processed</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Response Time</span>
                      <span className="text-sm font-medium">3.5 mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pending Emails</span>
                      <span className="text-sm font-medium">8</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auto Email Modal */}
      {showAutoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto-Process Emails</h2>
            <p className="text-gray-600 mb-4">
              This will automatically process multiple emails from your inbox using AI. 
              How many emails would you like to process?
            </p>
            
            <div className="mb-4">
              <label htmlFor="emailCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Emails
              </label>
              <input
                type="number"
                id="emailCount"
                min="1"
                max="50"
                value={autoEmailCount}
                onChange={(e) => setAutoEmailCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAutoModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoEmails}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Process Emails
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style>
        {`
          .dot-typing {
            position: relative;
            left: -9999px;
            width: 6px;
            height: 6px;
            border-radius: 5px;
            background-color: #9880ff;
            color: #9880ff;
            box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            animation: dot-typing 1.5s infinite linear;
          }

          @keyframes dot-typing {
            0% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
            16.667% {
              box-shadow: 9984px -6px 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
            33.333% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
            50% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px -6px 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
            66.667% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
            83.333% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px -6px 0 0 #9880ff;
            }
            100% {
              box-shadow: 9984px 0 0 0 #9880ff, 9994px 0 0 0 #9880ff, 10004px 0 0 0 #9880ff;
            }
          }
        `}
      </style>
    </div>
  );
};

export default EmailResponse;