// frontend/src/pages/Features/EmailResponse/KnowledgeSidebar.tsx - Modified for main content

import React, { useState, useEffect } from 'react';
import { knowledgeService, KnowledgeSection } from '../../../services/KnowledgeService';

const KnowledgeSidebar: React.FC = () => {
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSection[]>([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load knowledge base data
  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  // Fetch knowledge base from API
  const fetchKnowledgeBase = async () => {
    setIsLoading(true);
    
    try {
      const sections = await knowledgeService.getKnowledgeBase();
      setKnowledgeSections(sections);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new knowledge section
  const handleAddSection = async () => {
    if (!newSectionTitle.trim() || !newSectionContent.trim()) return;
    
    try {
      const newSection = await knowledgeService.addKnowledgeSection({
        title: newSectionTitle,
        content: newSectionContent
      });
      
      // Add to local state
      setKnowledgeSections(prev => [...prev, newSection]);
      
      // Reset form
      setNewSectionTitle('');
      setNewSectionContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding knowledge section:', error);
      alert('Failed to add knowledge section. Please try again.');
    }
  };

  // Save edited section
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    
    try {
      const updatedSection = await knowledgeService.updateKnowledgeSection(id, {
        title: editTitle,
        content: editContent
      });
      
      // Update in local state
      setKnowledgeSections(prev => 
        prev.map(section => 
          section.id === id ? updatedSection : section
        )
      );
      
      // Reset editing state
      setIsEditing(null);
      setEditTitle('');
      setEditContent('');
    } catch (error) {
      console.error('Error updating knowledge section:', error);
      alert('Failed to update knowledge section. Please try again.');
    }
  };

  // Delete section
  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this knowledge base section?')) {
      return;
    }
    
    try {
      await knowledgeService.deleteKnowledgeSection(id);
      
      // Remove from local state
      setKnowledgeSections(prev => prev.filter(section => section.id !== id));
    } catch (error) {
      console.error('Error deleting knowledge section:', error);
      alert('Failed to delete knowledge section. Please try again.');
    }
  };

  // Initialize knowledge base from text_documents.py
  const handleInitializeFromTextDocuments = async () => {
    if (!window.confirm('This will initialize the knowledge base from text_documents.py. Any existing knowledge base entries will be overwritten. Continue?')) {
      return;
    }
    
    setIsInitializing(true);
    
    try {
      await knowledgeService.initializeFromTextDocuments();
      await fetchKnowledgeBase(); // Refresh the knowledge base
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
      alert('Failed to initialize knowledge base. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  };

  // Sync knowledge base with text_documents.py
  const handleSyncKnowledgeBase = async () => {
    setIsSyncing(true);
    
    try {
      await knowledgeService.syncKnowledgeBase();
      alert('Knowledge base successfully synced with text_documents.py');
    } catch (error) {
      console.error('Error syncing knowledge base:', error);
      alert('Failed to sync knowledge base. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Start editing a section
  const startEdit = (section: KnowledgeSection) => {
    setIsEditing(section.id);
    setEditTitle(section.title);
    setEditContent(section.content);
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(null);
    setEditTitle('');
    setEditContent('');
  };

  return (
    <div className="bg-neutral-50 h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Knowledge Base Management</h1>
          <p className="text-neutral-600">
            Create and manage responses that the AI assistant will use to generate accurate replies.
          </p>
        </div>
        
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center gap-2 ${isAdding ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isAdding ? (
                  <>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Adding
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Content
                  </>
                )}
              </button>
              
              <button
                onClick={handleSyncKnowledgeBase}
                disabled={isSyncing}
                className={`flex items-center gap-2 ${
                  isSyncing ? 'btn-secondary opacity-70 cursor-not-allowed' : 'btn-accent'
                }`}
              >
                {isSyncing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync to Backend
                  </>
                )}
              </button>
              
              <button
                onClick={handleInitializeFromTextDocuments}
                disabled={isInitializing}
                className={`flex items-center gap-2 ${
                  isInitializing ? 'btn-secondary opacity-70 cursor-not-allowed' : 'btn-secondary'
                }`}
              >
                {isInitializing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initializing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import from Backend
                  </>
                )}
              </button>
            </div>
            
            {/* Add new section form */}
            {isAdding && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">Add New Knowledge</h3>
                
                <div className="mb-4">
                  <label htmlFor="sectionTitle" className="form-label">
                    Title
                  </label>
                  <input
                    id="sectionTitle"
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    className="form-input w-full"
                    placeholder="E.g., Application Process"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="sectionContent" className="form-label">
                    Content
                  </label>
                  <textarea
                    id="sectionContent"
                    value={newSectionContent}
                    onChange={(e) => setNewSectionContent(e.target.value)}
                    className="form-input w-full"
                    rows={6}
                    placeholder="Enter knowledge content here..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleAddSection}
                    disabled={!newSectionTitle.trim() || !newSectionContent.trim()}
                    className={`flex-1 ${
                      !newSectionTitle.trim() || !newSectionContent.trim()
                        ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Knowledge base content */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-neutral-900">Current Knowledge</h2>
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-4 border-t-primary-500 border-neutral-200 animate-spin mb-4"></div>
                <p className="text-neutral-600">Loading knowledge base...</p>
              </div>
            ) : knowledgeSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-neutral-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-neutral-600">No knowledge base content added yet. Add content to improve email responses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledgeSections.map((section) => (
                  <div key={section.id} className="card hover-lift transition-all duration-300">
                    {isEditing === section.id ? (
                      <div className="p-4">
                        <div className="mb-3">
                          <label className="form-label">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="form-input w-full mb-2"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Content</label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="form-input w-full mb-2"
                            rows={6}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(section.id)}
                            className="flex-1 btn-primary text-sm"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b border-neutral-200 flex items-start justify-between">
                          <h4 className="text-lg font-medium text-neutral-900 flex-1 pr-2">{section.title}</h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(section)}
                              className="p-1.5 rounded-md text-primary-600 hover:bg-primary-50 transition-colors duration-200"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors duration-200"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-4 text-neutral-600 text-sm max-h-48 overflow-y-auto">
                          {section.content}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeSidebar;