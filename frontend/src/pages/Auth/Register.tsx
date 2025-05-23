import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  
  // School information
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  
  // User information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNextStep = () => {
    if (step === 1) {
      // Validate school information
      if (!schoolName || !schoolEmail || !schoolPhone || !schoolAddress) {
        setError('Please fill in all required school information');
        return;
      }
      
      setError('');
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate user information
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const schoolData = {
      name: schoolName,
      contactEmail: schoolEmail,
      contactPhone: schoolPhone,
      address: schoolAddress,
    };
    
    const userData = {
      name,
      email,
    };
    
    const success = await register(schoolData, userData);
    
    if (success) {
      navigate('/setup');
    } else {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Register Your Institution</h1>
          <p className="text-gray-600 mt-2">
            {step === 1 ? 'Step 1: School Information' : 'Step 2: Account Details'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={step === 2 ? handleSubmit : handleNextStep}>
          {step === 1 ? (
            // Step 1: School Information
            <>
              <div className="mb-4">
                <label htmlFor="schoolName" className="block text-gray-700 text-sm font-bold mb-2">
                  Institution Name*
                </label>
                <input
                  id="schoolName"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Example University"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="schoolEmail" className="block text-gray-700 text-sm font-bold mb-2">
                  Institution Email*
                </label>
                <input
                  id="schoolEmail"
                  type="email"
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="contact@example.edu"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="schoolPhone" className="block text-gray-700 text-sm font-bold mb-2">
                  Contact Phone*
                </label>
                <input
                  id="schoolPhone"
                  type="tel"
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="(123) 456-7890"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="schoolAddress" className="block text-gray-700 text-sm font-bold mb-2">
                  Institution Address*
                </label>
                <textarea
                  id="schoolAddress"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="123 University Ave, City, State 12345"
                  rows={3}
                  required
                />
              </div>
            </>
          ) : (
            // Step 2: User Account Information
            <>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                  Your Name*
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Your Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="you@example.edu"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Password*
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm Password*
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          )}
          
          <div className="flex justify-between space-x-4 mt-6">
            {step === 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Back
              </button>
            )}
            
            <button
              type={step === 2 ? 'submit' : 'button'}
              disabled={loading}
              className={`${
                step === 1 ? 'w-full' : 'flex-1'
              } bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {step === 1
                ? 'Next'
                : loading
                ? 'Registering...'
                : 'Complete Registration'}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Already registered?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;