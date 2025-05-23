import axios from 'axios';

// Define the base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Message type definition
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// API message format
interface ApiMessage {
  role: string;
  content: string;
}

// Chat request interface
interface ChatRequest {
  message: string;
  user_id: string;
  conversation_history?: ApiMessage[];
  session_id?: string;
}

// Chat response interface
interface ChatResponse {
  response: string;
  conversation_id?: string;
  processing_time?: number;
  suggested_questions?: string[];
}

/**
 * Service to handle chat-related API calls and local storage
 */
class ChatService {
  // Cache timeout (1 hour in milliseconds)
  private CACHE_TIMEOUT = 60 * 60 * 1000;
  
  // Cache for common responses
  private responseCache: Record<string, { timestamp: number, response: ChatResponse }> = {};
  
  /**
   * Send a message to the chat API
   * @param message The message text
   * @param userId The user's ID
   * @param conversationHistory Previous messages
   * @param sessionId Optional session ID for continuity
   * @returns The API response
   */
  async sendMessage(
    message: string,
    userId: string,
    conversationHistory: Message[] = [],
    sessionId?: string
  ): Promise<ChatResponse> {
    // Check cache for common questions (only if there's no conversation context)
    if (conversationHistory.length === 0) {
      const cacheKey = this.generateCacheKey(message);
      const cachedResponse = this.checkCache(cacheKey);
      
      if (cachedResponse) {
        console.log('Using cached response');
        return cachedResponse;
      }
    }
    
    try {
      // Convert message history to API format
      const apiHistory = conversationHistory
        .filter(msg => msg.id !== 'welcome') // Skip welcome message
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      // Prepare request data
      const requestData: ChatRequest = {
        message,
        user_id: userId,
        conversation_history: apiHistory.length > 0 ? apiHistory : undefined,
        session_id: sessionId
      };
      
      // Make API call
      const response = await axios.post<ChatResponse>(
        `${API_BASE_URL}/chat`,
        requestData,
        { timeout: 30000 } // 30 second timeout
      );
      
      // Cache the response if appropriate
      if (conversationHistory.length === 0 && this.isCacheable(message)) {
        const cacheKey = this.generateCacheKey(message);
        this.addToCache(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }
  
  /**
   * Retrieve conversation history from local storage
   * @returns The stored conversation or null if not found
   */
  getStoredConversation(): { messages: Message[], conversationId: string | null } | null {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      const savedConversationId = localStorage.getItem('conversationId');
      
      if (!savedMessages) {
        return null;
      }
      
      const parsedMessages = JSON.parse(savedMessages);
      // Convert string dates back to Date objects
      const messages = parsedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      return {
        messages,
        conversationId: savedConversationId
      };
    } catch (error) {
      console.error('Error retrieving stored conversation:', error);
      return null;
    }
  }
  
  /**
   * Save conversation to local storage
   * @param messages The messages to save
   * @param conversationId The conversation ID
   */
  saveConversation(messages: Message[], conversationId: string | null): void {
    try {
      if (messages.length > 1) { // Don't save if only welcome message exists
        localStorage.setItem('chatMessages', JSON.stringify(messages));
      }
      
      if (conversationId) {
        localStorage.setItem('conversationId', conversationId);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
  
  /**
   * Clear the conversation from local storage and optionally from the server
   * @param conversationId The conversation ID to clear on the server
   */
  async clearConversation(conversationId: string | null): Promise<void> {
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('conversationId');
    
    // Also clear on server if we have a conversation ID
    if (conversationId) {
      try {
        await axios.delete(`${API_BASE_URL}/chat/history/${conversationId}`);
      } catch (error) {
        console.error('Error clearing conversation on server:', error);
      }
    }
  }
  
  /**
   * Generate a cache key for a message
   * @param message The message text
   * @returns A cache key
   */
  private generateCacheKey(message: string): string {
    // Normalize the message by removing extra spaces and lowercasing
    const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
    return `chat_${normalized}`;
  }
  
  /**
   * Check if a response is in the cache and not expired
   * @param key The cache key
   * @returns The cached response or null
   */
  private checkCache(key: string): ChatResponse | null {
    if (key in this.responseCache) {
      const { timestamp, response } = this.responseCache[key];
      
      if (Date.now() - timestamp < this.CACHE_TIMEOUT) {
        return response;
      } else {
        // Remove expired cache entry
        delete this.responseCache[key];
      }
    }
    return null;
  }
  
  /**
   * Add a response to the cache
   * @param key The cache key
   * @param response The response to cache
   */
  private addToCache(key: string, response: ChatResponse): void {
    this.responseCache[key] = {
      timestamp: Date.now(),
      response
    };
    
    // Prune cache if it gets too large (keep last 50 items)
    const keys = Object.keys(this.responseCache);
    if (keys.length > 50) {
      const oldestKey = keys.sort((a, b) => 
        this.responseCache[a].timestamp - this.responseCache[b].timestamp
      )[0];
      delete this.responseCache[oldestKey];
    }
  }
  
  /**
   * Determine if a message is cacheable
   * @param message The message text
   * @returns True if the message is cacheable
   */
  private isCacheable(message: string): boolean {
    // Don't cache very long or personal messages
    if (message.length > 150) return false;
    
    // Don't cache messages with personal pronouns or context-specific terms
    const personalTerms = [
      'my', 'mine', 'i am', 'i have', 'i will', 'i want', 'i need',
      'me', 'myself', 'our', 'we', 'us', 'you', 'your', 'today',
      'yesterday', 'tomorrow', 'this week', 'last week', 'next week'
    ];
    
    const lowerMsg = message.toLowerCase();
    return !personalTerms.some(term => lowerMsg.includes(term));
  }
}

// Export a singleton instance
export const chatService = new ChatService();