// frontend/src/pages/Features/EmailResponse/EmailSidebar.tsx

import React, { useState } from 'react';
import axios from 'axios';

interface TaskStatus {
  [key: string]: {
    status: string;
    startTime: number;
    url?: string;
    endTime?: number;
  };
}

const EmailSidebar: React.FC = () => {
  const [emailLink, setEmailLink] = useState('');
  const [autoEmailCount, setAutoEmailCount] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTasks, setActiveTasks] = useState<TaskStatus>({});
  const [showAutoModal, setShowAutoModal] = useState(false);

  // Handle email link submission
  const handleEmailLinkSubmit = async () => {
    if (!emailLink.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingStatus('Initializing browser...');
    
    try {
      // Call backend API
      const response = await axios.post('http://localhost:8000/api/process-email', {
        slate_url: emailLink
      });
      
      // Handle successful response
      if (response.data.task_id) {
        // Store task ID and status
        setActiveTasks(prev => ({
          ...prev,
          [response.data.task_id]: {
            status: 'running',
            startTime: Date.now(),
            url: emailLink
          }
        }));
        
        // Start polling for status
        pollTaskStatus(response.data.task_id);
      }
      
      setProcessingStatus(response.data.message);
      
    } catch (error) {
      console.error('Error starting email processing:', error);
      setProcessingStatus('Error: Failed to start processing. Please try again.');
    } finally {
      setIsProcessing(false);
      setEmailLink('');
    }
  };

  // Poll for task status
  const pollTaskStatus = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      const response = await axios.get(`http://localhost:8000/api/task/${taskId}`);
      
      // Update task status
      setActiveTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: response.data.status,
          ...(response.data.status === 'completed' || response.data.status === 'failed' 
            ? { endTime: Date.now() } 
            : {})
        }
      }));
      
      // Continue polling if task is still running
      if (response.data.status === 'running') {
        setTimeout(() => pollTaskStatus(taskId), 5000);
      }
      
    } catch (error) {
      console.error('Error polling task status:', error);
    }
  };

  // Handle multiple email processing
  const handleAutomatedEmails = async () => {
    
    setIsProcessing(true);
    setProcessingStatus('Initializing browser...');
    
    try {
      // Call backend API
      const response = await axios.post('http://localhost:8000/api/process-bulk-email', {
        slate_url: emailLink
      });
      
      // Handle successful response
      if (response.data.task_id) {
        // Store task ID and status
        setActiveTasks(prev => ({
          ...prev,
          [response.data.task_id]: {
            status: 'running',
            startTime: Date.now(),
            url: emailLink
          }
        }));
        
        // Start polling for status
        pollTaskStatus(response.data.task_id);
      }
      
      setProcessingStatus(response.data.message);
      
    } catch (error) {
      console.error('Error starting email processing:', error);
      setProcessingStatus('Error: Failed to start processing. Please try again.');
    } finally {
      setIsProcessing(false);
      setEmailLink('');
    }
  };

  // Format time duration
  const formatDuration = (startTime: number, endTime = Date.now()) => {
    const durationSecs = Math.floor((endTime - startTime) / 1000);
    if (durationSecs < 60) return `${durationSecs} sec`;
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sidebar-header p-6 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800">Automated Tools</h2>
      </div>
      
      {/* Process specific email section */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Process Specific Email</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={emailLink}
            onChange={(e) => setEmailLink(e.target.value)}
            placeholder="Enter Slate URL..."
            className="form-input w-full"
            disabled={isProcessing}
          />
          <button
            onClick={handleEmailLinkSubmit}
            disabled={!emailLink.trim() || isProcessing}
            className={`w-full ${
              !emailLink.trim() || isProcessing 
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill='none' viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Process Email'}
          </button>
          <p className="text-xs text-neutral-500">
            Enter the Slate URL to access and process an email
          </p>
        </div>
      </div>
      
      {/* Batch processing section */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Batch Processing</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              max="50"
              value={autoEmailCount}
              onChange={(e) => setAutoEmailCount(parseInt(e.target.value) || 1)}
              className="form-input flex-1"
              disabled={isProcessing}
            />
            <button
              onClick={handleAutomatedEmails}
              disabled={isProcessing}
              className={`px-4 ${isProcessing ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'btn-accent'}`}
            >
              Process
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Enter the number of emails to process automatically
          </p>
        </div>
      </div>
      
      {/* Status display */}
      {processingStatus && (
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Processing Status</h3>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-primary-700 text-sm">
            {processingStatus}
          </div>
        </div>
      )}
      
      {/* Active tasks */}
      {Object.keys(activeTasks).length > 0 && (
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Active Tasks</h3>
          <div className="space-y-3">
            {Object.entries(activeTasks).map(([taskId, task]) => (
              <div key={taskId} className="card p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className={`badge ${
                    task.status === 'running' ? 'badge-primary' : 
                    task.status === 'completed' ? 'badge-success' : 
                    'badge-warning'
                  }`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {task.endTime 
                      ? formatDuration(task.startTime, task.endTime)
                      : formatDuration(task.startTime)}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 truncate" title={task.url}>
                  {task.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Stats section */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Today's Stats</h3>
        <div className="bg-neutral-50 rounded-lg p-4 border border-border-neutral-200">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
                    <span className="text-neutral-600">Emails Processed</span>
                    <span className="font-medium text-neutral-800">12</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
                    <span className="text-neutral-600">Avg. Response Time</span>
                    <span className="font-medium text-neutral-800">3.5 mins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Pending Emails</span>
                    <span className="font-medium text-neutral-800">8</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Auto Email Modal */}
            {showAutoModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-4">Auto-Process Emails</h2>
                  <p className="text-neutral-600 mb-6">
                    This will automatically process multiple emails from your inbox. 
                    How many emails would you like to process?
                  </p>
                  
                  <div className="mb-6">
                    <label htmlFor="emailCount" className="form-label">Number of Emails</label>
                    <input
                      type="number"
                      id="emailCount"
                      min="1"
                      max="50"
                      value={autoEmailCount}
                      onChange={(e) => setAutoEmailCount(parseInt(e.target.value) || 1)}
                      className="form-input w-full"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAutoModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAutomatedEmails}
                      className="btn-primary"
                    >
                      Process Emails
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      };

export default EmailSidebar;