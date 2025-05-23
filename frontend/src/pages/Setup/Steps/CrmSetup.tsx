import React, { useState, useEffect } from 'react';
import { useSetup } from '../../../context/SetupContext';

const CrmSetup: React.FC = () => {
  const { setupState, updateCrmConfig } = useSetup();
  const { crmConfig } = setupState;
  
  const [url, setUrl] = useState(crmConfig.url);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  // URL validation function
  const validateUrl = (input: string) => {
    // Basic URL validation regex
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(input);
  };

  // Check if URL contains 'slate' as per requirements
  const containsSlate = (input: string) => {
    return input.toLowerCase().includes('slate');
  };

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setValidationError('');
    
    // Update context with new URL, but mark as invalid until validated
    updateCrmConfig({
      url: value,
      isValid: false,
    });
  };

  // Handle URL validation
  const handleValidate = () => {
    setIsValidating(true);
    setValidationError('');
    
    // Simulating validation API call
    setTimeout(() => {
      const isValidUrl = validateUrl(url);
      const hasSlate = containsSlate(url);
      
      if (!isValidUrl) {
        setValidationError('Please enter a valid URL');
        setIsValidating(false);
        return;
      }
      
      if (!hasSlate && url.trim() !== '') {
        setValidationError("URL must contain 'slate' for this demo. Try adding it to your URL.");
        setIsValidating(false);
        return;
      }
      
      // Update context with validated URL
      updateCrmConfig({
        url,
        isValid: true,
      });
      
      setIsValidating(false);
    }, 1500);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 3: Configure CRM Connection</h2>
      <p className="mb-6 text-gray-600">
        Connect your AI agent to your institution's CRM system. This allows the agent to access
        and interact with your email inbox and student data.
      </p>
      
      <div className="mb-6">
        <label htmlFor="crmUrl" className="block text-sm font-medium text-gray-700 mb-1">
          CRM Inbox URL
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="crmUrl"
            value={url}
            onChange={handleUrlChange}
            className={`focus:ring-blue-500 focus:border-blue-500 flex-grow block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300 ${
              validationError ? 'border-red-300' : ''
            }`}
            placeholder="https://slate.yourinstitution.edu/inbox"
          />
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating || !url.trim()}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white ${
              isValidating || !url.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isValidating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating
              </>
            ) : (
              'Validate'
            )}
          </button>
        </div>
        
        {validationError && (
          <p className="mt-2 text-sm text-red-600">{validationError}</p>
        )}
        
        <p className="mt-2 text-sm text-gray-500">
          Enter the URL for your CRM inbox. For this demo, the URL must contain "slate".
        </p>
      </div>
      
      {crmConfig.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">CRM Connection Validated</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your agent is now connected to your CRM system.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Integration Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Once connected, your AI agent will be able to use the Browser-Use framework to access your CRM inbox.
                This allows the agent to read emails and prepare responses based on your knowledge base.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmSetup;