import React, { createContext, useContext, useState, useEffect } from 'react';

// Define Setup State Types
export interface AgentConfig {
  role: string;
  permissions: {
    readEmails: boolean;
    writeEmails: boolean;
    sendEmailsAutomatically: boolean;
    processDocuments: boolean;
  };
}

export interface KnowledgeBase {
  isUploaded: boolean;
  filename?: string;
  content?: string;
}

export interface CrmConfig {
  url: string;
  isValid: boolean;
}

export interface SetupState {
  isComplete: boolean;
  currentStep: number;
  agentConfig: AgentConfig;
  knowledgeBase: KnowledgeBase;
  crmConfig: CrmConfig;
}

// Define Context Type
interface SetupContextType {
  setupState: SetupState;
  updateAgentConfig: (config: Partial<AgentConfig>) => void;
  updateKnowledgeBase: (knowledge: Partial<KnowledgeBase>) => void;
  updateCrmConfig: (crm: Partial<CrmConfig>) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeSetup: () => void;
  resetSetup: () => void;
}

// Initial Setup State
const initialSetupState: SetupState = {
  isComplete: false,
  currentStep: 1,
  agentConfig: {
    role: '',
    permissions: {
      readEmails: true,
      writeEmails: true,
      sendEmailsAutomatically: false,
      processDocuments: true,
    },
  },
  knowledgeBase: {
    isUploaded: false,
  },
  crmConfig: {
    url: '',
    isValid: false,
  },
};

// Create Context
const SetupContext = createContext<SetupContextType>({
  setupState: initialSetupState,
  updateAgentConfig: () => {},
  updateKnowledgeBase: () => {},
  updateCrmConfig: () => {},
  nextStep: () => {},
  prevStep: () => {},
  completeSetup: () => {},
  resetSetup: () => {},
});

// Hook to use the setup context
export const useSetup = () => useContext(SetupContext);

// Provider Component
export const SetupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with values from localStorage if available
  const [setupState, setSetupState] = useState<SetupState>(() => {
    const savedSetup = localStorage.getItem('setupState');
    if (savedSetup) {
      try {
        return JSON.parse(savedSetup);
      } catch (error) {
        console.error('Error parsing saved setup state:', error);
      }
    }
    return initialSetupState;
  });

    // Update localStorage when state changes
    useEffect(() => {
      localStorage.setItem('setupState', JSON.stringify(setupState));
      console.log('Setup state updated:', setupState); // Debug logging
    }, [setupState]);


  // Update Agent Config
  const updateAgentConfig = (config: Partial<AgentConfig>) => {
    setSetupState(prev => ({
      ...prev,
      agentConfig: {
        ...prev.agentConfig,
        ...config,
      },
    }));
  };

  // Update Knowledge Base
  const updateKnowledgeBase = (knowledge: Partial<KnowledgeBase>) => {
    setSetupState(prev => ({
      ...prev,
      knowledgeBase: {
        ...prev.knowledgeBase,
        ...knowledge,
      },
    }));
  };

  // Update CRM Config
  const updateCrmConfig = (crm: Partial<CrmConfig>) => {
    setSetupState(prev => ({
      ...prev,
      crmConfig: {
        ...prev.crmConfig,
        ...crm,
      },
    }));
  };

  // Navigate to Next Step
  const nextStep = () => {
    if (setupState.currentStep < 3) {
      setSetupState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  // Navigate to Previous Step
  const prevStep = () => {
    if (setupState.currentStep > 1) {
      setSetupState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  // Complete Setup
  const completeSetup = () => {
    const updatedState = {
      ...setupState,
      isComplete: true,
    };
    setSetupState(updatedState);
    // Force immediate update to localStorage
    localStorage.setItem('setupState', JSON.stringify(updatedState));
    console.log('Setup marked as complete:', updatedState); // Debug logging
  };

  // Reset Setup
  const resetSetup = () => {
    setSetupState(initialSetupState);
  };

  // Context Value
  const value = {
    setupState,
    updateAgentConfig,
    updateKnowledgeBase,
    updateCrmConfig,
    nextStep,
    prevStep,
    completeSetup,
    resetSetup,
  };

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
};