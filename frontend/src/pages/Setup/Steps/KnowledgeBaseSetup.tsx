import React, { useState, useRef } from 'react';
import { useSetup } from '../../../context/SetupContext';

const KnowledgeBaseSetup: React.FC = () => {
  const { setupState, updateKnowledgeBase } = useSetup();
  const { knowledgeBase } = setupState;
  
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [fileName, setFileName] = useState<string | null>(knowledgeBase.filename || null);
  const [textContent, setTextContent] = useState<string>(knowledgeBase.content || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate file upload process
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setFileName(file.name);
      simulateUpload();
      
      // Read file contents
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        // Update context after "upload" is complete
        setTimeout(() => {
          updateKnowledgeBase({
            isUploaded: true,
            filename: file.name,
            content: content,
          });
        }, 3000);
      };
      
      reader.readAsText(file);
    }
  };

  // Handle text input
  const handleTextSubmit = () => {
    if (textContent.trim()) {
      simulateUpload();
      
      // Update context after "processing" is complete
      setTimeout(() => {
        updateKnowledgeBase({
          isUploaded: true,
          filename: 'manual-entry.txt',
          content: textContent,
        });
      }, 3000);
    }
  };

  // Handle clear
  const handleClear = () => {
    setFileName(null);
    setTextContent('');
    fileInputRef.current!.value = '';
    updateKnowledgeBase({
      isUploaded: false,
      filename: undefined,
      content: undefined,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Step 2: Upload Knowledge Base</h2>
      <p className="mb-6 text-gray-600">
        Provide information that will help the AI agent respond to emails and process documents accurately.
        This can include FAQs, enrollment procedures, program details, and other institutional information.
      </p>
      
      {!knowledgeBase.isUploaded ? (
        <>
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`px-4 py-2 text-sm font-medium ${
                  uploadMethod === 'file'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('text')}
                className={`px-4 py-2 text-sm font-medium ${
                  uploadMethod === 'text'
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Enter Text
              </button>
            </div>

            {uploadMethod === 'file' ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="knowledgeFile"
                  ref={fileInputRef}
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
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
                
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="knowledgeFile"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">TXT, PDF, DOCX up to 10MB</p>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Select File
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="knowledgeText" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Knowledge Base Content
                </label>
                <textarea
                  id="knowledgeText"
                  rows={10}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Enter FAQs, procedures, policies, and other information..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                ></textarea>
                
                <button
                  type="button"
                  onClick={handleTextSubmit}
                  disabled={!textContent.trim()}
                  className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    textContent.trim()
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-300 cursor-not-allowed'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Process Text
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Knowledge Base Uploaded</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  {knowledgeBase.filename} has been successfully uploaded and processed.
                </p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
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
  );
};

export default KnowledgeBaseSetup;