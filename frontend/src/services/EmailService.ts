// frontend/src/services/KnowledgeService.ts

import axios from 'axios';

// Knowledge section type
export interface KnowledgeSection {
  id: string;
  title: string;
  content: string;
}

// API base URL
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Service to handle knowledge base operations
 */
class KnowledgeService {
  /**
   * Get all knowledge base sections
   * @returns Promise with knowledge sections
   */
  async getKnowledgeBase(): Promise<KnowledgeSection[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/knowledge`);
      return response.data;
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      // Return mock data on error (for development)
      return this.getMockKnowledgeBase();
    }
  }
  
  /**
   * Add a new knowledge section
   * @param section Knowledge section to add
   * @returns Promise with the added section
   */
  async addKnowledgeSection(section: Omit<KnowledgeSection, 'id'>): Promise<KnowledgeSection> {
    try {
      const response = await axios.post(`${API_BASE_URL}/knowledge`, section);
      return response.data;
    } catch (error) {
      console.error('Error adding knowledge section:', error);
      throw error;
    }
  }
  
  /**
   * Update a knowledge section
   * @param id Section ID
   * @param updates Updates to apply
   * @returns Promise with the updated section
   */
  async updateKnowledgeSection(
    id: string, 
    updates: Partial<Pick<KnowledgeSection, 'title' | 'content'>>
  ): Promise<KnowledgeSection> {
    try {
      const response = await axios.put(`${API_BASE_URL}/knowledge/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating knowledge section:', error);
      throw error;
    }
  }
  
  /**
   * Delete a knowledge section
   * @param id Section ID to delete
   * @returns Promise with success status
   */
  async deleteKnowledgeSection(id: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/knowledge/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting knowledge section:', error);
      throw error;
    }
  }
  
  /**
   * Sync the knowledge base with text_documents.py
   * @returns Promise with success status
   */
  async syncKnowledgeBase(): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/knowledge/sync`);
      return response.data;
    } catch (error) {
      console.error('Error syncing knowledge base:', error);
      throw error;
    }
  }
  
  /**
   * Initialize the knowledge base from text_documents.py
   * @returns Promise with success status and number of sections
   */
  async initializeFromTextDocuments(): Promise<{ success: boolean, sections: number }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/knowledge/initialize-from-text-documents`);
      return response.data;
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
      throw error;
    }
  }
  
  /**
   * Get mock knowledge base data for development/fallback
   * @returns Array of knowledge sections
   */
  private getMockKnowledgeBase(): KnowledgeSection[] {
    return [
      {
        id: 'kb-1',
        title: 'Application Status',
        content: 'We have received all of your documents. Your application is under [Pending Initial review/Pending Document Verification].'
      },
      {
        id: 'kb-2',
        title: 'Deposit Refund Policy',
        content: 'The deposit is a non-refundable payment unless you were denied your visa. If you were denied your visa you may share the 221G slip and request a refund. For further details, please contact Mr. Neal E Jeffery - njeffery@iit.edu / 312-567-5053.'
      },
      {
        id: 'kb-3',
        title: 'TOEFL/IELTS Requirement',
        content: 'All international students are required to submit TOEFL/IELTS test scores. If you have a 2-year degree from the United States or if you are from a TOEFL/IELTS waiver-eligible country, then we may waive this requirement. For more information: https://www.iit.edu/admissions-aid/graduate-admission/international-students/application-requirements-and-checklist'
      }
    ];
  }
}

// Export a singleton instance
export const knowledgeService = new KnowledgeService();