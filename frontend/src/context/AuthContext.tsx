import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for user and school
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface School {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

// Define the context shape
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  school: School | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (schoolData: Omit<School, 'id'>, userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  school: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: true,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem('user');
      const savedSchool = localStorage.getItem('school');
      
      if (savedUser && savedSchool) {
        setUser(JSON.parse(savedUser));
        setSchool(JSON.parse(savedSchool));
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Mock login function - would be replaced with actual API call
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      if (email && password) {
        const mockUser: User = {
          id: '1',
          email,
          name: 'John Doe',
        };
        
        const mockSchool: School = {
          id: '1',
          name: 'Example University',
          contactEmail: email,
          contactPhone: '123-456-7890',
          address: '123 Example St, City, State 12345',
        };
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('school', JSON.stringify(mockSchool));
        
        // Update state
        setUser(mockUser);
        setSchool(mockSchool);
        setIsAuthenticated(true);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mock registration function
  const register = async (
    schoolData: Omit<School, 'id'>, 
    userData: Omit<User, 'id'>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const mockUser: User = {
        id: '1',
        ...userData,
      };
      
      const mockSchool: School = {
        id: '1',
        ...schoolData,
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('school', JSON.stringify(mockSchool));
      
      // Update state
      setUser(mockUser);
      setSchool(mockSchool);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    setUser(null);
    setSchool(null);
    setIsAuthenticated(false);
  };

  // Context value
  const value = {
    isAuthenticated,
    user,
    school,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};