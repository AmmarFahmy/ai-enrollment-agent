import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard Pages
import Dashboard from './pages/Dashboard/Dashboard';
import SetupWizard from './pages/Setup/SetupWizard';
import EmailResponse from './pages/Features/EmailResponse';
import EmailResponsePage from './pages/Features/EmailResponse/EmailResponsePage';
import DocumentProcessing from './pages/Features/DocumentProcessing';
import ChatPage from './pages/Features/ChatPage'; // Import our new ChatPage

// Context for Auth
import { AuthProvider, useAuth } from './context/AuthContext';
import { SetupProvider } from './context/SetupContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null; // Render nothing while redirecting
  }
  
  return <>{children}</>;
};

// App with Global Providers
function App() {
  return (
    <AuthProvider>
      <SetupProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route 
              path="/setup" 
              element={
                <ProtectedRoute>
                  <SetupWizard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/email-response" 
              element={
                <ProtectedRoute>
                  <EmailResponsePage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/document-processing" 
              element={
                <ProtectedRoute>
                  <DocumentProcessing />
                </ProtectedRoute>
              } 
            />
            
            {/* New Chat Page Route */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </SetupProvider>
    </AuthProvider>
  );
}

export default App;