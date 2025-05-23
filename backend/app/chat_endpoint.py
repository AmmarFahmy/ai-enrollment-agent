from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import logging

from app.agno_manager.knowledge_base import knowledge_base
from agno.agent import Agent
from agno.models.google import Gemini
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

# Response model for chat
class ChatResponse(BaseModel):
    response: str

# Initialize Agno agent
def get_agent():
    try:
        agent = Agent(
            model=Gemini(id="gemini-2.0-flash", api_key=API_KEY),
            role="Your role is AI agent of Graduate enrollment counsellor of Illinois Institute of Technology Chicago, and you assist students and other enrollment advisors in their queries.",
            knowledge=knowledge_base,
            search_knowledge=True
        )
        
        # Load knowledge base
        agent.knowledge.load(recreate=True)
        return agent
    except Exception as e:
        logger.error(f"Error initializing Agno agent: {str(e)}")
        raise RuntimeError(f"Failed to initialize Agno agent: {str(e)}")

# Add chat endpoint to the FastAPI app
def add_chat_endpoint(app: FastAPI):
    @app.post("/api/chat", response_model=ChatResponse)
    async def chat(request: ChatRequest):
        logger.info(f"Received chat request from user {request.user_id}: {request.message}")
        
        try:
            # Initialize agent
            agent = get_agent()
            
            # Build conversation history context
            conversation_context = ""
            if request.conversation_history:
                for msg in request.conversation_history[-5:]:  # Use last 5 messages for context
                    conversation_context += f"{msg.role}: {msg.content}\n"
            
            # Build prompt with context
            prompt = f"""our role is AI Agent of Graduate enrollment counsellor of Illinois Institute of Technology Chicago, and you assist students and other enrollment advisors in their queries.
            
            {f'Previous conversation:\n{conversation_context}\n' if conversation_context else ''}
            
            Search the knowledge base to provide accurate information about the following student inquiry:
            {request.message}
            
            Guidelines:
            1. Provide detailed, accurate responses based on the knowledge base.
            2. Be professional and helpful and do not redirect students again to grad.admission@iit.edu instead give them appropriate enrollment counseller email address.
            3. If the knowledge base lacks specific information, acknowledge the email and provide general guidance.
            4. Keep responses concise but thorough.
            5. Format information clearly using paragraphs, bullet points and no asterisks. Draft appropriate messages in such a way that user can directly copy paste.
            6. If user sends a Student query email, do not include the subject in the response.
            7. Do not inlcude previous response in the response if it is not necessary.
            """
            
            # Process the query
            response = agent.run(prompt)
            
            return ChatResponse(response=response.content)
            
        except Exception as e:
            logger.error(f"Error processing chat request: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")