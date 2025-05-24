from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import logging
import time
from functools import lru_cache

# Import Agno-related components
from agno.agent import Agent
from agno.models.google import Gemini
from app.agno_manager.knowledge_base import knowledge_base
from agno.tools.googlesearch import GoogleSearchTools
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Key for Gemini model
API_KEY = os.getenv('GEMINI_API_KEY')

# Message model for conversation history
class Message(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

# Request model for chat
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "anonymous"
    conversation_history: Optional[List[Message]] = []
    session_id: Optional[str] = None

# Response model for chat
class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None
    processing_time: Optional[float] = None
    suggested_questions: Optional[List[str]] = None

# Error model
class ErrorResponse(BaseModel):
    error: str
    code: int = 500

# Session storage for conversation continuity
conversation_sessions: Dict[str, List[Message]] = {}

# Response cache with TTL for common questions
response_cache = {}
CACHE_TTL = 3600  # 1 hour in seconds

# Agno agent singleton
agno_agent = None

@lru_cache(maxsize=1)
def get_agno_agent():
    """Get or create the Agno agent (singleton pattern with caching)"""
    global agno_agent
    if agno_agent is None:
        logger.info("Initializing Agno agent")
        start_time = time.time()
        agno_agent = Agent(
            model=Gemini(
                id="gemini-2.5-flash-preview-04-17", 
                api_key=API_KEY,
                temperature=0.2,  # Lower temperature for more deterministic responses
            ),
            role="You are an AI Enrollment Counselor for Illinois Institute of Technology. Your role is to provide accurate, helpful information about admissions, programs, tuition, and student life at Illinois Tech.",
            instructions=[
                "If you cannot find the answer in the knowledge base, search the web (https://www.iit.edu/) for relevant information.",
            ],
            knowledge=knowledge_base,
            tools=[GoogleSearchTools()],
            search_knowledge=True,
        )
        logger.info(f"Agno agent initialized in {time.time() - start_time:.2f} seconds")
    return agno_agent

def add_chat_endpoint(app: FastAPI):
    """Add optimized chat endpoint to the FastAPI app"""
    
    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
        start_time = time.time()
        logger.info(f"Received chat request from user {request.user_id}")
        
        # Create or retrieve conversation session
        session_id = request.session_id or f"session_{request.user_id}_{int(time.time())}"
        if session_id not in conversation_sessions:
            conversation_sessions[session_id] = []
        
        # Add user message to conversation history
        conversation_sessions[session_id].append(Message(role="user", content=request.message))
        
        # Check cache for common questions
        cache_key = _generate_cache_key(request.message)
        cached_response = _check_cache(cache_key)
        if cached_response:
            logger.info("Using cached response")
            conversation_sessions[session_id].append(Message(role="assistant", content=cached_response))
            
            # Generate suggested follow-up questions
            suggested_questions = _generate_suggested_questions(request.message, cached_response)
            
            return ChatResponse(
                response=cached_response,
                conversation_id=session_id,
                processing_time=time.time() - start_time,
                suggested_questions=suggested_questions
            )
        
        try:
            # Get conversation context from last 5 messages
            conversation_context = ""
            history_to_use = request.conversation_history or conversation_sessions[session_id]
            if history_to_use:
                for msg in history_to_use[-5:]:
                    conversation_context += f"{msg.role}: {msg.content}\n"
            
            # Process the query with the agent
            response = await _generate_chat_response(request.message, conversation_context)
            
            # Add assistant response to conversation history
            conversation_sessions[session_id].append(Message(role="assistant", content=response))
            
            # Cache the response if it's not too specific
            # (avoid caching responses with user-specific details)
            if len(request.message.split()) < 15 and not any(term in request.message.lower() for term in ["my", "i have", "i am", "i will", "me", "my name"]):
                _add_to_cache(cache_key, response)
            
            # Generate suggested follow-up questions
            suggested_questions = _generate_suggested_questions(request.message, response)
            
            # Clean up old sessions in the background
            background_tasks.add_task(_cleanup_old_sessions)
            
            # Return the response
            return ChatResponse(
                response=response,
                conversation_id=session_id,
                processing_time=time.time() - start_time,
                suggested_questions=suggested_questions
            )
            
        except Exception as e:
            logger.error(f"Error processing chat request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")
    
    @app.get("/api/chat/history/{session_id}")
    async def get_chat_history(session_id: str):
        """Get the conversation history for a session"""
        if session_id not in conversation_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"conversation": conversation_sessions[session_id]}
    
    @app.delete("/api/chat/history/{session_id}")
    async def clear_chat_history(session_id: str):
        """Clear the conversation history for a session"""
        if session_id in conversation_sessions:
            del conversation_sessions[session_id]
        
        return {"status": "success", "message": "Conversation history cleared"}

# Helper functions
def _generate_cache_key(message: str) -> str:
    """Generate a cache key for a message"""
    # Normalize the message by removing extra spaces and lowercasing
    normalized = " ".join(message.lower().split())
    return f"chat_{hash(normalized)}"

def _check_cache(key: str) -> Optional[str]:
    """Check if a response is in the cache and not expired"""
    if key in response_cache:
        timestamp, response = response_cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return response
        else:
            # Remove expired cache entry
            del response_cache[key]
    return None

def _add_to_cache(key: str, response: str):
    """Add a response to the cache with current timestamp"""
    response_cache[key] = (time.time(), response)

async def _generate_chat_response(message: str, conversation_context: str = "") -> str:
    """Generate a response to a chat message using Agno agent with knowledge base"""
    try:
        # Get the agent - already initialized
        agent = get_agno_agent()
        
        # Construct the prompt with conversation context
        prompt = f"""You are an AI Enrollment Counselor for Illinois Institute of Technology.
        
        {f'Previous conversation:\n{conversation_context}\n' if conversation_context else ''}
        
        Search the knowledge base to provide accurate information about the following inquiry:
        {message}
        
        Guidelines:
        1. Provide detailed, accurate responses based on the knowledge base.
        2. Be professional, helpful, and concise.
        3. If the knowledge base lacks specific information, search the web (iit.edu).
        4. Format information clearly without asterisks and never mention anything else or "i dont know" or " i am an AI".
        5. Focus on answering the specific question without providing unnecessary information.
        6. Avoid using the phrase "I am an AI" or similar disclaimers.
        7. If the user asks for a specific document or form, provide a link to the relevant page on the website.
        8. Always include sources for the information provided only exceptions for knwoledge based answers.
        """
        
        # Set a timeout for the agent run to prevent hanging
        result = await asyncio.wait_for(
            agent.arun(prompt),
            timeout=15  # 15 second timeout
        )
        
        return result.content
    
    except asyncio.TimeoutError:
        logger.error("Response generation timed out")
        return "I apologize, but I'm unable to generate a response at this time due to high processing load. Please try again with a more specific question."
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I apologize, but I encountered an error while generating a response. Please try again or rephrase your question."

def _generate_suggested_questions(user_message: str, ai_response: str) -> List[str]:
    """Generate suggested follow-up questions based on the conversation"""
    # Define common follow-up questions based on topic detection
    suggestions = []
    
    # Detect topic in user message and response
    message_lower = user_message.lower()
    response_lower = ai_response.lower()
    
    # Add topic-specific suggestions
    if any(term in message_lower or term in response_lower for term in ["tuition", "cost", "fee", "pay", "price", "financial"]):
        suggestions.append("What financial aid options are available?")
        suggestions.append("Are there any scholarships for international students?")
    
    if any(term in message_lower or term in response_lower for term in ["admission", "apply", "application", "requirement", "test", "gre", "gmat"]):
        suggestions.append("What's the application deadline for Fall semester?")
        suggestions.append("What are the minimum requirements for admission?")
    
    if any(term in message_lower or term in response_lower for term in ["program", "course", "major", "degree", "study"]):
        suggestions.append("What specializations are available for this program?")
        suggestions.append("How long does it take to complete this degree?")
    
    if any(term in message_lower or term in response_lower for term in ["housing", "accommodation", "dorm", "live", "apartment"]):
        suggestions.append("What housing options are available for graduate students?")
        suggestions.append("What's the cost of on-campus housing?")
    
    # Add generic follow-ups if we don't have topic-specific ones
    if len(suggestions) < 2:
        suggestions.append("How can I contact the admissions office?")
        suggestions.append("What makes Illinois Tech unique?")
    
    # Return a maximum of 3 suggestions
    return suggestions[:3]

async def _cleanup_old_sessions():
    """Clean up conversation sessions older than 24 hours"""
    # Implementation depends on how you track session creation time
    # For now, we'll just ensure the dictionary doesn't grow too large
    MAX_SESSIONS = 1000
    if len(conversation_sessions) > MAX_SESSIONS:
        # Remove oldest sessions (would need timestamp tracking for proper implementation)
        oldest_keys = list(conversation_sessions.keys())[:len(conversation_sessions) - MAX_SESSIONS]
        for key in oldest_keys:
            del conversation_sessions[key]