// frontend/src/pages/Features/EmailResponse/EmailSidebar.tsx - Enhanced with Dex MCP

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TaskStatus {
  task_id: string;
  status: string;
  progress: string;
  duration: string;
  screenshots: string[];
  results: {
    success?: boolean;
    processed?: number;
    total?: number;
    successful?: number;
    failed?: number;
    success_rate?: string;
    email_content?: string;
    generated_response?: string;
    processing_time?: string;
    details?: Array<{
      success: boolean;
      error?: string;
      processing_time: string;
    }>;
  };
  error: string;
}

interface DexConnectionStatus {
  success: boolean;
  message: string;
  tabs_available?: boolean;
}

const EmailSidebar: React.FC = () => {
  const [emailLink, setEmailLink] = useState('');
  const [bulkEmailCount, setBulkEmailCount] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTasks, setActiveTasks] = useState<{ [key: string]: TaskStatus }>({});
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [dexStatus, setDexStatus] = useState<DexConnectionStatus | null>(null);
  const [showScreenshots, setShowScreenshots] = useState<{ [key: string]: boolean }>({});

  // Check Dex connection status on component mount
  useEffect(() => {
    checkDexConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkDexConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Poll task statuses every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(activeTasks).forEach(taskId => {
        if (['running', 'initializing'].includes(activeTasks[taskId]?.status)) {
          pollTaskStatus(taskId);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTasks]);

  const checkDexConnection = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/dex/test-connection');
      setDexStatus(response.data);
    } catch (error) {
      setDexStatus({
        success: false,
        message: 'Failed to connect to backend'
      });
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/task-status/${taskId}`);
      const taskStatus: TaskStatus = response.data;
      
      setActiveTasks(prev => ({
        ...prev,
        [taskId]: taskStatus
      }));
    } catch (error) {
      console.error(`Error polling task ${taskId}:`, error);
    }
  };

  const handleSingleEmailProcess = async () => {
    if (!emailLink.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/process-email-dex', {
        slate_url: emailLink
      });
      
      if (response.data.success) {
        const taskId = response.data.task_id;
        
        // Initialize task in state
        setActiveTasks(prev => ({
          ...prev,
          [taskId]: {
            task_id: taskId,
            status: 'initializing',
            progress: 'Starting...',
            duration: '0s',
            screenshots: [],
            results: {},
            error: ''
          }
        }));
        
        // Start polling this task
        pollTaskStatus(taskId);
        
        // Clear the input
        setEmailLink('');
      }
    } catch (error) {
      console.error('Error starting single email processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEmailProcess = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/process-bulk-emails-dex', {
        count: bulkEmailCount
      });
      
      if (response.data.success) {
        const taskId = response.data.task_id;
        
        // Initialize task in state
        setActiveTasks(prev => ({
          ...prev,
          [taskId]: {
            task_id: taskId,
            status: 'initializing',
            progress: 'Starting bulk processing...',
            duration: '0s',
            screenshots: [],
            results: { total: bulkEmailCount, processed: 0 },
            error: ''
          }
        }));
        
        // Start polling this task
        pollTaskStatus(taskId);
      }
    } catch (error) {
      console.error('Error starting bulk email processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/task/${taskId}`);
      setActiveTasks(prev => {
        const updated = { ...prev };
        if (updated[taskId]) {
          updated[taskId].status = 'cancelled';
        }
        return updated;
      });
    } catch (error) {
      console.error(`Error cancelling task ${taskId}:`, error);
    }
  };

  const toggleScreenshots = (taskId: string) => {
    setShowScreenshots(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'initializing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatProgress = (task: TaskStatus) => {
    if (task.results.total && task.results.processed !== undefined) {
      return `${task.results.processed}/${task.results.total} emails`;
    }
    return task.progress;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="sidebar-header p-6 border-b border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-800">Dex MCP Tools</h2>
      </div>
      
      {/* Dex Connection Status */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Connection Status</h3>
        <div className={`p-3 rounded-lg border ${
          dexStatus?.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              dexStatus?.success ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {dexStatus?.success ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <p className="text-xs mt-1">{dexStatus?.message}</p>
          {dexStatus?.tabs_available && (
            <p className="text-xs mt-1">✓ Browser tabs accessible</p>
          )}
        </div>
        <button
          onClick={checkDexConnection}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          Test Connection
        </button>
      </div>
      
      {/* Single Email Processing */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">
          Process Single Email
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={emailLink}
            onChange={(e) => setEmailLink(e.target.value)}
            placeholder="Enter Slate URL..."
            className="form-input w-full"
            disabled={isProcessing || !dexStatus?.success}
          />
          <button
            onClick={handleSingleEmailProcess}
            disabled={!emailLink.trim() || isProcessing || !dexStatus?.success}
            className={`w-full ${
              !emailLink.trim() || isProcessing || !dexStatus?.success
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' 
                : 'btn-primary'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Process with Dex'}
          </button>
          <p className="text-xs text-neutral-500">
            Advanced browser automation with visual feedback
          </p>
        </div>
      </div>
      
      {/* Bulk Email Processing */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">
          Bulk Processing
        </h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="number"
              min="1"
              max="20"
              value={bulkEmailCount}
              onChange={(e) => setBulkEmailCount(parseInt(e.target.value) || 1)}
              className="form-input flex-1"
              disabled={isProcessing || !dexStatus?.success}
            />
            <button
              onClick={handleBulkEmailProcess}
              disabled={isProcessing || !dexStatus?.success}
              className={`px-4 ${
                isProcessing || !dexStatus?.success
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' 
                  : 'btn-accent'
              }`}
            >
              {isProcessing ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Bulk Process'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Process multiple emails from inbox automatically
          </p>
        </div>
      </div>
      
      {/* Active Tasks */}
      {Object.keys(activeTasks).length > 0 && (
        <div className="p-4 border-b border-neutral-200">
          <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">
            Active Tasks ({Object.keys(activeTasks).length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(activeTasks).map(([taskId, task]) => (
              <div key={taskId} className="card p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`badge text-xs ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-neutral-500">{task.duration}</span>
                    </div>
                    <p className="text-xs text-neutral-600 mb-1">
                      ID: {taskId.substring(0, 12)}...
                    </p>
                    {task.progress && (
                      <p className="text-xs text-neutral-700">
                        {formatProgress(task)}
                      </p>
                    )}
                  </div>
                  
                  {task.status === 'running' && (
                    <button
                      onClick={() => cancelTask(taskId)}
                      className="text-red-500 hover:text-red-700 ml-2"
                      title="Cancel task"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Task Results */}
                {task.status === 'completed' && task.results && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                    {task.results.successful !== undefined ? (
                      <div>
                        <p>✅ {task.results.successful}/{task.results.total} successful</p>
                        {task.results.success_rate && (
                          <p>Success rate: {task.results.success_rate}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p>✅ Email processed successfully</p>
                        {task.results.processing_time && (
                          <p>Time: {task.results.processing_time}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Error Display */}
                {task.status === 'failed' && task.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    <p>❌ {task.error}</p>
                  </div>
                )}
                
                {/* Screenshots */}
                {task.screenshots.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleScreenshots(taskId)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <svg className={`w-3 h-3 mr-1 transform ${showScreenshots[taskId] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {task.screenshots.length} screenshots
                    </button>
                    
                    {showScreenshots[taskId] && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {task.screenshots.slice(0, 6).map((screenshot, index) => (
                          <img
                            key={index}
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => {
                              // Open screenshot in new tab
                              const newWindow = window.open();
                              if (newWindow) {
                                newWindow.document.write(`<img src="${screenshot}" style="max-width:100%; height:auto;" />`);
                              }
                            }}
                          />
                        ))}
                        {task.screenshots.length > 6 && (
                          <div className="flex items-center justify-center text-xs text-neutral-500 border rounded">
                            +{task.screenshots.length - 6} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => window.open('http://localhost:8000/api/tasks', '_blank')}
            className="w-full text-left p-2 text-xs rounded hover:bg-neutral-50 border border-neutral-200"
          >
            📊 View All Tasks
          </button>
          <button
            onClick={async () => {
              try {
                await axios.post('http://localhost:8000/api/admin/clear-tasks');
                // Remove completed tasks from state
                setActiveTasks(prev => {
                  const filtered = Object.fromEntries(
                    Object.entries(prev).filter(([_, task]) => task.status === 'running')
                  );
                  return filtered;
                });
              } catch (error) {
                console.error('Error clearing tasks:', error);
              }
            }}
            className="w-full text-left p-2 text-xs rounded hover:bg-neutral-50 border border-neutral-200"
          >
            🗑️ Clear Completed Tasks
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4">
        <h3 className="text-sm uppercase font-semibold text-neutral-500 mb-3">Statistics</h3>
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
              <span className="text-neutral-600">Active Tasks</span>
              <span className="font-medium text-neutral-800">
                {Object.values(activeTasks).filter(t => t.status === 'running').length}
              </span>
            </div>
            <div className="flex justify-between text-sm border-b border-neutral-200 pb-2">
              <span className="text-neutral-600">Completed Today</span>
              <span className="font-medium text-neutral-800">
                {Object.values(activeTasks).filter(t => t.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Success Rate</span>
              <span className="font-medium text-neutral-800">
                {Object.values(activeTasks).length > 0 
                  ? `${Math.round(Object.values(activeTasks).filter(t => t.status === 'completed').length / Object.values(activeTasks).length * 100)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSidebar;