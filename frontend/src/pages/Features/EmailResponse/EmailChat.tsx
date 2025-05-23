// frontend/src/pages/Features/EmailResponse/EmailChat.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

// Message type definition
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const EmailChat: React.FC = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your Email Response Assistant. I can help you draft email responses to student inquiries. Paste email content or provide details, and I\'ll help you craft a response.',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Load conversation history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('emailChatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message exists
      localStorage.setItem('emailChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to format message text with proper line breaks and links
  const formatMessageText = (text: string) => {
    if (!text) return '';
    
    // Replace markdown-style links with HTML links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const textWithLinks = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>');
    
    // Replace newlines with <br> tags
    return textWithLinks.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: line }} />
      </React.Fragment>
    ));
  };

  // Handle message submission
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Add to conversation and clear input
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    setSuggestedQuestions([]); // Clear suggestions when sending message
    
    try {
      // Call backend API for email response generation
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: userMessage.content,
        user_id: user?.id || 'anonymous',
        conversation_type: 'email'
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      // Create AI response message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Set suggested follow-up questions if provided
      if (response.data.suggested_questions && response.data.suggested_questions.length > 0) {
        setSuggestedQuestions(response.data.suggested_questions);
      }
      
    } catch (error) {
      console.error('Error getting response from AI:', error);
      
      // Error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle suggested question click
  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question);
    // Focus the textarea
    textareaRef.current?.focus();
  };

  // Copy message content to clipboard
  const copyToClipboard = (messageId: string, content: string) => {
    // Create a cleaned version of the content without markdown or HTML
    const cleanContent = content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // Convert markdown links to plain text
      .replace(/<[^>]*>/g, ''); // Remove any HTML tags
      
    navigator.clipboard.writeText(cleanContent).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    });
  };

  // Clear conversation
  const handleClearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([
        {
          id: 'welcome',
          content: 'Hello! I\'m your Email Response Assistant. I can help you draft email responses to student inquiries. Paste email content or provide details, and I\'ll help you craft a response.',
          sender: 'ai',
          timestamp: new Date(),
        }
      ]);
      setSuggestedQuestions([]);
      localStorage.removeItem('emailChatMessages');
    }
  };

  return (
    <div className="claude-chat-container">
      {/* Messages Display */}
      <div className="claude-messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`claude-message ${message.sender === 'user' ? 'claude-user-message' : 'claude-ai-message'}`}
          >
            <div className="claude-message-header">
              <div className="claude-message-avatar">
                {message.sender === 'user' ? (
                  <div className="claude-user-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                ) : (
                  <div className="claude-ai-avatar">
                    <span>AI</span>
                  </div>
                )}
              </div>
              <div className="claude-message-sender">
                {message.sender === 'user' ? 'You' : 'Email Assistant'}
              </div>
            </div>
            
            <div className="claude-message-content">
              {formatMessageText(message.content)}
            </div>
            
            {message.sender === 'ai' && (
              <div className="claude-message-actions">
                <button 
                  onClick={() => copyToClipboard(message.id, message.content)}
                  className="claude-action-button"
                  aria-label="Copy to clipboard"
                >
                  {copiedMessageId === message.id ? (
                    <span>Copied!</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="claude-message claude-ai-message">
            <div className="claude-message-header">
              <div className="claude-message-avatar">
                <div className="claude-ai-avatar">
                  <span>AI</span>
                </div>
              </div>
              <div className="claude-message-sender">
                Email Assistant
              </div>
            </div>
            <div className="claude-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && !isProcessing && (
        <div className="claude-suggested-questions">
          <div className="claude-suggestions-label">Suggested follow-ups</div>
          <div className="claude-suggestions-container">
            {suggestedQuestions.map((q, index) => (
              <button
                key={`suggestion-${index}`}
                onClick={() => handleSuggestedQuestionClick(q)}
                className="claude-suggestion-button"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="claude-input-container">
        <div className="claude-input-wrapper">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Paste an email or describe what you need help with..."
            rows={1}
            disabled={isProcessing}
            className="claude-input-textarea"
          />
          <button
            onClick={handleSendMessage}
            disabled={isProcessing || !inputValue.trim()}
            className={`claude-send-button ${(!inputValue.trim() || isProcessing) ? 'claude-disabled' : ''}`}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        
        <div className="claude-input-footer">
          <div className="claude-input-hint">
            <span className="claude-shortcut">Shift + Enter</span> for new line · 
            <span className="claude-shortcut">Enter</span> to send
          </div>
          
          <button 
            className="claude-clear-button"
            onClick={handleClearConversation}
            title="Clear conversation"
          >
            Clear conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailChat;