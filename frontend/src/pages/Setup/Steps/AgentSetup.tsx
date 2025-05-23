import React, { useState } from 'react';
import { useSetup } from '../../../context/SetupContext';

const AgentSetup: React.FC = () => {
  const { setupState, updateAgentConfig } = useSetup();
  const { agentConfig } = setupState;
  
  const [role, setRole] = useState(agentConfig.role);
  const [readEmails, setReadEmails] = useState(agentConfig.permissions.readEmails);
  const [writeEmails, setWriteEmails] = useState(agentConfig.permissions.writeEmails);
  const [sendAutoEmails, setSendAutoEmails] = useState(agentConfig.permissions.sendEmailsAutomatically);
  const [processDocuments, setProcessDocuments] = useState(agentConfig.permissions.processDocuments);

  // Update the context when form changes
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRole(value);
    updateAgentConfig({ role: value });
  };

  const handlePermissionChange = (permission: keyof typeof agentConfig.permissions, value: boolean) => {
    const updatedPermissions = {
      ...agentConfig.permissions,
      [permission]: value,
    };
    
    // Update local state
    switch (permission) {
      case 'readEmails':
        setReadEmails(value);
        break;
      case 'writeEmails':
        setWriteEmails(value);
        break;
      case 'sendEmailsAutomatically':
        setSendAutoEmails(value);
        break;
      case 'processDocuments':
        setProcessDocuments(value);
        break;
    }
    
    // Update context
    updateAgentConfig({ permissions: updatedPermissions });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 1: Define AI Agent Role & Permissions</h2>
      
      <div className="mb-6">
        <label htmlFor="agentRole" className="block text-sm font-medium text-gray-700 mb-1">
          Agent Role
        </label>
        <select
          id="agentRole"
          value={role}
          onChange={handleRoleChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          required
        >
          <option value="">Select an agent role</option>
          <option value="enrollment_assistant">Enrollment Assistant</option>
          <option value="application_processor">Application Processor</option>
          <option value="document_analyzer">Document Analyzer</option>
          <option value="custom">Custom Role</option>
        </select>
        <p className="mt-2 text-sm text-gray-500">
          Select the primary role for your AI agent. This will determine its default behavior.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Agent Permissions</h3>
        <p className="mb-4 text-sm text-gray-500">
          Define what actions your AI agent is allowed to perform.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="readEmails"
                type="checkbox"
                checked={readEmails}
                onChange={(e) => handlePermissionChange('readEmails', e.target.checked)}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="readEmails" className="font-medium text-gray-700">
                Read Emails
              </label>
              <p className="text-gray-500">
                Allow the agent to read emails from your CRM inbox
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="writeEmails"
                type="checkbox"
                checked={writeEmails}
                onChange={(e) => handlePermissionChange('writeEmails', e.target.checked)}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="writeEmails" className="font-medium text-gray-700">
                Write Email Responses
              </label>
              <p className="text-gray-500">
                Allow the agent to draft responses to emails
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="sendAutoEmails"
                type="checkbox"
                checked={sendAutoEmails}
                onChange={(e) => handlePermissionChange('sendEmailsAutomatically', e.target.checked)}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="sendAutoEmails" className="font-medium text-gray-700">
                Send Emails Automatically
              </label>
              <p className="text-gray-500">
                Allow the agent to send emails without manual approval
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="processDocuments"
                type="checkbox"
                checked={processDocuments}
                onChange={(e) => handlePermissionChange('processDocuments', e.target.checked)}
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="processDocuments" className="font-medium text-gray-700">
                Process Documents
              </label>
              <p className="text-gray-500">
                Allow the agent to analyze and extract data from uploaded documents
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {!role && (
        <div className="rounded-md bg-yellow-50 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Required Field</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please select an agent role to continue.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSetup;