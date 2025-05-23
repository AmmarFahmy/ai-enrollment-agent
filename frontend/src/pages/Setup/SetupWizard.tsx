import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetupProvider, useSetup } from '../../context/SetupContext';
import AgentSetup from './Steps/AgentSetup';
import KnowledgeBaseSetup from './Steps/KnowledgeBaseSetup';
import CrmSetup from './Steps/CrmSetup';

// Progress bar component
const ProgressBar: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Define AI Agent Role' },
    { number: 2, label: 'Upload Knowledge Base' },
    { number: 3, label: 'Configure CRM' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div 
            key={step.number} 
            className={`flex flex-col items-center ${
              currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                currentStep >= step.number ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}
            >
              {step.number}
            </div>
            <div className="text-sm text-center">{step.label}</div>
          </div>
        ))}
      </div>
      
      <div className="relative mt-2">
        <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
        <div 
          className="absolute top-0 left-0 h-1 bg-blue-500 transition-all" 
          style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

// Main Wizard Component
const SetupWizardContent: React.FC = () => {
  const { setupState, nextStep, prevStep, completeSetup } = useSetup();
  const navigate = useNavigate();

  // If setup is already complete, redirect to dashboard
  useEffect(() => {
    if (setupState.isComplete) {
      navigate('/dashboard');
    }
  }, [setupState.isComplete, navigate]);

  // Handle finish setup
  const handleFinish = () => {
    // Validate all required fields are completed
    const { agentConfig, knowledgeBase, crmConfig } = setupState;
    
    if (!agentConfig.role || !knowledgeBase.isUploaded || !crmConfig.isValid) {
      alert('Please complete all required setup steps before proceeding.');
      return;
    }
    
    completeSetup();
    setTimeout(() => {
        navigate('/dashboard');
      }, 100);
  };
  
  // Render appropriate step
  const renderStep = () => {
    switch (setupState.currentStep) {
      case 1:
        return <AgentSetup />;
      case 2:
        return <KnowledgeBaseSetup />;
      case 3:
        return <CrmSetup />;
      default:
        return <AgentSetup />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Your AI Enrollment Counselor</h1>
          <p className="text-gray-600 mb-6">
            Complete these steps to configure your AI agent and get started.
          </p>
          
          <ProgressBar currentStep={setupState.currentStep} />
          
          {renderStep()}
          
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            {setupState.currentStep > 1 && (
              <button
                onClick={prevStep}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
              >
                Back
              </button>
            )}
            
            {setupState.currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="ml-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="ml-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper with Setup Provider
const SetupWizard: React.FC = () => {
  return (
    <SetupProvider>
      <SetupWizardContent />
    </SetupProvider>
  );
};

export default SetupWizard;