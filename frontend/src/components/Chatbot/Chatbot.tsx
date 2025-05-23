import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Chatbot.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface ChatbotProps {
  initialPrompt?: string | null;
  onStartConversation?: () => void;
}

const formatMessageText = (text: string) => {
  if (!text) return '';
  
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const textWithLinks = text.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 underline hover:text-primary-700 transition-colors duration-200">$1</a>');
  
  return textWithLinks.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      <span dangerouslySetInnerHTML={{ __html: line }} />
    </React.Fragment>
  ));
};

const Chatbot: React.FC<ChatbotProps> = ({ initialPrompt, onStartConversation }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: 'Hello! I\'m your AI Enrollment Counselor. I can help answer questions about admissions, tuition, programs, and other enrollment-related queries. How can I assist you today?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);
  const [processingPrompt, setProcessingPrompt] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && !initialPromptProcessed && !processingPrompt) {
      setProcessingPrompt(true);
      setInputValue(initialPrompt);
      
      setTimeout(() => {
        handleSendMessage(initialPrompt);
        if (onStartConversation) onStartConversation();
        setInitialPromptProcessed(true);
        setProcessingPrompt(false);
      }, 100);
    }
  }, [initialPrompt, onStartConversation]);

  useEffect(() => {
    if (initialPrompt === null || initialPrompt === undefined) {
      setInitialPromptProcessed(false);
    }
  }, [initialPrompt]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    const savedConversationId = localStorage.getItem('conversationId');
    
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
    
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    if (conversationId) {
      localStorage.setItem('conversationId', conversationId);
    }
  }, [messages, conversationId]);

  const handleSendMessage = useCallback(async (contentOverride?: string) => {
    const content = contentOverride || inputValue;
    if (!content.trim() || isProcessing) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (!contentOverride) setInputValue('');
    
    setIsProcessing(true);
    setSuggestedQuestions([]);
    
    try {
      const messageHistory = messages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));
      
      const response = await axios.post('http://localhost:8000/api/chat', {
        message: userMessage.content,
        user_id: user?.id || 'anonymous',
        conversation_history: messageHistory,
        session_id: conversationId
      }, { timeout: 30000 });
      
      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: response.data.response,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (response.data.suggested_questions?.length > 0) {
        setSuggestedQuestions(
          response.data.suggested_questions.map((q: string, i: number) => ({
            id: `suggestion-${Date.now()}-${i}`,
            text: q
          }))
        );
      }
    } catch (error) {
      console.error('Error getting response from AI:', error);
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
  }, [inputValue, isProcessing, messages, conversationId, user?.id]);

  const handleSuggestedQuestionClick = (question: string) => {
    setInputValue(question);
    textareaRef.current?.focus();
  };

  const copyToClipboard = (messageId: string, content: string) => {
    const cleanContent = content
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
      .replace(/<[^>]*>/g, '');
      
    navigator.clipboard.writeText(cleanContent).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const handleClearConversation = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setMessages([{
        id: 'welcome',
        content: 'Hello! I\'m your AI Enrollment Counselor. I can help answer questions about admissions, tuition, programs, and other enrollment-related queries. How can I assist you today?',
        sender: 'ai',
        timestamp: new Date(),
      }]);
      setConversationId(null);
      setSuggestedQuestions([]);
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('conversationId');
      
      if (conversationId) {
        axios.delete(`http://localhost:8000/api/chat/history/${conversationId}`)
          .catch(err => console.error('Error clearing conversation history on server:', err));
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                  message.sender === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-white shadow-card border border-neutral-200'
                }`}
              >
                <div className="flex items-start mb-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 text-sm font-medium ${
                    message.sender === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-100 text-primary-600'
                  }`}>
                    {message.sender === 'user' 
                      ? user?.name?.charAt(0).toUpperCase() || 'U'
                      : 'AI'}
                  </div>
                  <div>
                    <div className={`font-medium ${message.sender === 'user' ? 'text-white' : 'text-neutral-900'}`}>
                      {message.sender === 'user' ? 'You' : 'Illinois Tech AI Assistant'}
                    </div>
                    <div className={`text-xs ${message.sender === 'user' ? 'text-primary-100' : 'text-neutral-500'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className={`message-content ${message.sender === 'user' ? 'text-white' : 'text-neutral-700'}`}>
                  {formatMessageText(message.content)}
                </div>
                
                {message.sender === 'ai' && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-end">
                    <button 
                      onClick={() => copyToClipboard(message.id, message.content)}
                      className="flex items-center text-xs text-neutral-500 hover:text-primary-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-neutral-100"
                    >
                      {copiedMessageId === message.id ? (
                        <>
                          <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 bg-white shadow-card border border-neutral-200">
                <div className="flex items-center mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full mr-2 text-sm font-medium bg-primary-100 text-primary-600">
                    AI
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Illinois Tech AI Assistant</div>
                    <div className="text-xs text-neutral-500">Thinking...</div>
                  </div>
                </div>
                
                <div className="flex space-x-2 px-2 py-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {suggestedQuestions.length > 0 && !isProcessing && (
        <div className="bg-white border-t border-neutral-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-xs uppercase font-semibold text-neutral-500 mb-2">Suggested questions</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSuggestedQuestionClick(q.text)}
                  className="btn-outline text-xs py-1.5"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white border-t border-neutral-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl shadow-sm border border-neutral-300 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 bg-white transition-all duration-200">
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
              placeholder="Message Illinois Tech AI Assistant..."
              rows={1}
              disabled={isProcessing}
              className="block w-full border-0 py-3 px-4 resize-none focus:ring-0 sm:text-sm rounded-t-xl"
            />
            <div className="flex items-center justify-between border-t border-neutral-200 p-2">
              <div className="flex items-center space-x-2 text-xs text-neutral-500">
                <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">Shift + Enter</span>
                <span>for new line</span>
                <span className="mx-1">•</span>
                <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">Enter</span>
                <span>to send</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearConversation}
                  className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 transition-colors duration-200"
                >
                  Clear conversation
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isProcessing || !inputValue.trim()}
                  className={`p-2 rounded-full ${
                    isProcessing || !inputValue.trim()
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } transition-colors duration-200`}
                >
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;