import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SetupProvider, useSetup } from '../../context/SetupContext';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';

// Document Types
type DocumentType = 'transcript' | 'application' | 'recommendation' | 'financial' | 'other';

// Document interface
interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: string;
  status: 'processing' | 'processed' | 'error';
  fileSize: string;
}

// Analysis Result Types
interface TranscriptAnalysis {
  studentName: string;
  institution: string;
  gpa: number;
  totalCredits: number;
  courses: {
    code: string;
    name: string;
    grade: string;
    credits: number;
  }[];
  passRate: number;
  standingStatus: string;
}

interface ApplicationAnalysis {
  studentName: string;
  appliedProgram: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  education: {
    institution: string;
    degree: string;
    graduationDate: string;
  };
  completenessScore: number;
  missingItems?: string[];
}

interface GenericAnalysis {
  summary: string;
  keyPoints: string[];
  recommendation: string;
}

// Document Processing Component
const DocumentProcessingContent: React.FC = () => {
  const { user } = useAuth();
  const { setupState } = useSetup();
  const navigate = useNavigate();
  
  // States
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('transcript');
  const [analysisResult, setAnalysisResult] = useState<TranscriptAnalysis | ApplicationAnalysis | GenericAnalysis | null>(null);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if setup is complete
// Check if setup is complete
    useEffect(() => {
        // Get setup state directly from localStorage to avoid context issues
        const savedSetup = localStorage.getItem('setupState');
        
        if (savedSetup) {
        try {
            const setupData = JSON.parse(savedSetup);
            // Only redirect if explicitly not complete
            if (setupData.isComplete !== true) {
            console.log('Redirecting to setup because isComplete is not true:', setupData);
            navigate('/setup');
            } else {
            console.log('Setup is complete, staying on current page');
            }
        } catch (error) {
            console.error('Error parsing setup state:', error);
            // On error, don't redirect
        }
        } else {
        // No setup state found
        console.log('No setup state found, redirecting to setup');
        navigate('/setup');
        }
    }, [navigate]);

  // Mock upload process
  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStatus('Uploading document...');
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleDocumentProcessing(file.name);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Mock document processing
  const handleDocumentProcessing = (fileName: string) => {
    setProcessingStatus('Processing document with Mistral OCR API...');
    
    setTimeout(() => {
      const newDocument: Document = {
        id: `doc-${documents.length + 1}`,
        name: fileName,
        type: documentType,
        uploadDate: new Date().toISOString(),
        status: 'processed',
        fileSize: `${Math.floor(Math.random() * 10 + 1)} MB`,
      };
      
      setDocuments((prev) => [...prev, newDocument]);
      setSelectedDocument(newDocument);
      setIsUploading(false);
      setProcessingStatus('');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Generate mock analysis based on document type
      generateMockAnalysis(documentType);
    }, 3000);
  };

  // Generate mock analysis results based on document type
  const generateMockAnalysis = (type: DocumentType) => {
    switch (type) {
      case 'transcript':
        setAnalysisResult({
          studentName: 'Alex Johnson',
          institution: 'State University',
          gpa: 3.6,
          totalCredits: 87,
          courses: [
            { code: 'MATH101', name: 'Calculus I', grade: 'A', credits: 4 },
            { code: 'CS201', name: 'Data Structures', grade: 'B+', credits: 3 },
            { code: 'ENG102', name: 'Composition', grade: 'A-', credits: 3 },
            { code: 'PHYS101', name: 'Physics I', grade: 'B', credits: 4 },
            { code: 'HIST205', name: 'World History', grade: 'A', credits: 3 },
          ],
          passRate: 100,
          standingStatus: 'Good Standing',
        });
        break;
      case 'application':
        setAnalysisResult({
          studentName: 'Taylor Williams',
          appliedProgram: 'Computer Science (BS)',
          contactInfo: {
            email: 'taylor.williams@example.com',
            phone: '(555) 123-4567',
          },
          education: {
            institution: 'Central High School',
            degree: 'High School Diploma',
            graduationDate: '2024-05-15',
          },
          completenessScore: 85,
          missingItems: ['Letter of Recommendation', 'SAT Scores'],
        });
        break;
      default:
        setAnalysisResult({
          summary: 'This document appears to be a personal statement discussing the applicant\'s interest in the Engineering program.',
          keyPoints: [
            'Applicant has participated in 3 science competitions',
            'Strong interest in robotics and AI',
            'Volunteer experience at local STEM workshops',
            'Seeking scholarship opportunities',
          ],
          recommendation: 'Consider for Engineering Scholarship Program based on demonstrated interest and experience in robotics.',
        });
    }
    
    // Show analysis after a brief delay
    setTimeout(() => {
      setIsAnalysisVisible(true);
    }, 500);
  };

  // Handle document selection
  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
    setIsAnalysisVisible(false);
    
    // Generate mock analysis based on document type
    setTimeout(() => {
      generateMockAnalysis(doc.type);
    }, 500);
  };

  // Handle document type change
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value as DocumentType);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render analysis result based on document type
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    if ('courses' in analysisResult) {
      // Transcript analysis
      const transcriptResult = analysisResult as TranscriptAnalysis;
      return (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Student Name</p>
                <p className="font-medium">{transcriptResult.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Institution</p>
                <p className="font-medium">{transcriptResult.institution}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GPA</p>
                <p className="font-medium">{transcriptResult.gpa.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Credits</p>
                <p className="font-medium">{transcriptResult.totalCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Standing Status</p>
                <p className="font-medium">{transcriptResult.standingStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pass Rate</p>
                <p className="font-medium">{transcriptResult.passRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Course Details</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transcriptResult.courses.map((course, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {course.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-1/3 text-sm font-medium text-gray-500">GPA Standing</div>
                <div className="w-2/3 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{ width: `${(transcriptResult.gpa / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-1/3 text-sm font-medium text-gray-500">Progress to Degree</div>
                <div className="w-2/3 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(transcriptResult.totalCredits / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-1/3 text-sm font-medium text-gray-500">Pass Rate</div>
                <div className="w-2/3 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full"
                    style={{ width: `${transcriptResult.passRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if ('appliedProgram' in analysisResult) {
      // Application analysis
      const applicationResult = analysisResult as ApplicationAnalysis;
      return (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Applicant Name</p>
                <p className="font-medium">{applicationResult.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Applied Program</p>
                <p className="font-medium">{applicationResult.appliedProgram}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{applicationResult.contactInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{applicationResult.contactInfo.phone}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Education Background</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Institution</p>
                <p className="font-medium">{applicationResult.education.institution}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Degree</p>
                <p className="font-medium">{applicationResult.education.degree}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Graduation Date</p>
                <p className="font-medium">{formatDate(applicationResult.education.graduationDate)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completeness Score</span>
                <span className="text-sm font-medium text-gray-700">{applicationResult.completenessScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${applicationResult.completenessScore}%` }}></div>
              </div>
            </div>
            
            {applicationResult.missingItems && applicationResult.missingItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Missing Items</h4>
                <ul className="list-disc pl-5 text-sm text-red-600">
                  {applicationResult.missingItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Generic analysis
      const genericResult = analysisResult as GenericAnalysis;
      return (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Summary</h3>
            <p className="text-gray-700">{genericResult.summary}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Points</h3>
            <ul className="list-disc pl-5 space-y-2">
              {genericResult.keyPoints.map((point, index) => (
                <li key={index} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendation</h3>
            <p className="text-gray-700">{genericResult.recommendation}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Document Processing & Analysis</h1>
          
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload New Document</h2>
            <p className="mb-4 text-gray-600">
              Upload student documents for AI analysis. The system will use Mistral OCR API to process and extract
              relevant information.
            </p>
            
            <div className="flex flex-col md:flex-row md:space-x-4 mt-6">
              <div className="md:w-1/3 mb-4 md:mb-0">
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={handleDocumentTypeChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="transcript">Transcript</option>
                  <option value="application">Application Form</option>
                  <option value="recommendation">Letter of Recommendation</option>
                  <option value="financial">Financial Aid Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="md:w-2/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Document
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX, PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        {processingStatus}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white shadow rounded-lg p-6 h-fit">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Document History</h2>
              
              {documents.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No documents processed yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className={`py-4 cursor-pointer hover:bg-gray-50 ${
                        selectedDocument?.id === doc.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleDocumentSelect(doc)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>{formatDate(doc.uploadDate)}</span>
                            <span className="mx-1">•</span>
                            <span>{doc.fileSize}</span>
                          </div>
                        </div>
                        <div>
                          {doc.status === 'processed' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Processed
                            </span>
                          ) : doc.status === 'processing' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Processing
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Error
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 capitalize">{doc.type}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="lg:col-span-2">
              {selectedDocument && isAnalysisVisible ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Analysis Results: {selectedDocument.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {selectedDocument.type}
                    </span>
                  </div>
                  
                  {renderAnalysisResult()}
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Download Report
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Add to Student Record
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center justify-center h-full py-12">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No document selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a document from the history or upload a new one to view analysis results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Document Processing Wrapper with Setup Provider
const DocumentProcessing: React.FC = () => {
  return (
    <SetupProvider>
      <DocumentProcessingContent />
    </SetupProvider>
  );
};

export default DocumentProcessing;