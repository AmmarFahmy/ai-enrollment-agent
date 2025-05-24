# backend/main.py - Updated with Dex MCP Integration

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import asynccontextmanager
from pydantic import BaseModel
import asyncio
import os
from dotenv import load_dotenv
import logging
from functools import lru_cache
import time
from typing import List, Dict, Any
import json

# Import Dex MCP client
from app.dex_mcp_client import DexMCPClient, EmailProcessingResult

# Import Agno-related components
from agno.agent import Agent as AgnoAgent
from agno.models.google import Gemini
from app.agno_manager.knowledge_base import knowledge_base
from app.optimized_chat_endpoint import add_chat_endpoint
from app.knowledge_endpoint import router as knowledge_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)

# Gemini API Key
API_KEY = os.getenv('GEMINI_API_KEY')

# Initialize shared resources at startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize knowledge base
    initialize_knowledge_base()
    # Pre-load the agent model
    _ = get_agno_agent()
    yield
    # Clean up resources at shutdown
    pass

# Create FastAPI app
app = FastAPI(
    title="AI Enrollment Counselor API with Dex MCP",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(knowledge_router)
add_chat_endpoint(app)

# Pydantic models
class EmailRequest(BaseModel):
    slate_url: str

class BulkEmailRequest(BaseModel):
    inbox_url: str = "https://apply.illinoistech.edu/manage/inbox/?pg=0&assigned=1&role=f5edcd42-fab7-4ea4-86fe-782aaed1f604"
    count: int = 5

class EmailResponse(BaseModel):
    message: str
    task_id: str
    success: bool = True

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: str
    duration: str
    screenshots: List[str] = []
    results: Dict[str, Any] = {}
    error: str = ""

# Global state
agno_agent = None
active_tasks: Dict[str, Dict[str, Any]] = {}
dex_clients: Dict[str, DexMCPClient] = {}

def initialize_knowledge_base():
    """Initialize knowledge base"""
    logger.info("Initializing knowledge base at application startup")
    try:
        knowledge_base.load(recreate=False)
        logger.info("Knowledge base successfully loaded")
    except Exception as e:
        logger.error(f"Failed to load knowledge base: {str(e)}")

@lru_cache(maxsize=1)
def get_agno_agent():
    """Get or create the Agno agent (singleton)"""
    global agno_agent
    if agno_agent is None:
        logger.info("Initializing Agno agent")
        start_time = time.time()
        agno_agent = AgnoAgent(
            model=Gemini(
                id="gemini-2.5-flash-preview-04-17", 
                api_key=API_KEY,
                temperature=0.2,
            ),
            role="You are a Graduate enrollment counselor at Illinois Institute of Technology.",
            knowledge=knowledge_base,
            search_knowledge=True,
        )
        logger.info(f"Agno agent initialized in {time.time() - start_time:.2f} seconds")
    return agno_agent

async def generate_response_with_agno(question: str) -> str:
    """Generate response using Agno agent"""
    try:
        agent = get_agno_agent()
        
        prompt = f"""
        You are a graduate enrollment counselor at Illinois Institute of Technology.
        Search knowledge base and draft a professional email response (no subject line, no asterisks) to: 
        
        {question}
        
        Guidelines:
        - Be concise and professional
        - Use knowledge base information when available
        - Format as a complete email response ready to send
        - Do not include subject line
        - Use proper email formatting
        """
        
        result = await asyncio.wait_for(
            agent.arun(prompt),
            timeout=30
        )
        
        return result.content
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I apologize, but I'm unable to generate a response at this time. Please try again later."

async def get_dex_client(task_id: str) -> DexMCPClient:
    """Get or create Dex MCP client for task"""
    if task_id not in dex_clients:
        client = DexMCPClient()
        connected = await client.connect()
        if not connected:
            raise ConnectionError("Failed to connect to Dex MCP server")
        dex_clients[task_id] = client
    return dex_clients[task_id]

async def cleanup_dex_client(task_id: str):
    """Clean up Dex client after task completion"""
    if task_id in dex_clients:
        try:
            await dex_clients[task_id].disconnect()
            del dex_clients[task_id]
        except Exception as e:
            logger.error(f"Error cleaning up Dex client: {str(e)}")

# API Endpoints

@app.post("/api/process-email-dex", response_model=EmailResponse)
async def process_email_with_dex(request: EmailRequest, background_tasks: BackgroundTasks):
    """Process single email using Dex MCP"""
    task_id = f"dex_single_{int(time.time() * 1000)}"
    
    try:
        # Initialize task status
        active_tasks[task_id] = {
            "status": "initializing",
            "start_time": time.time(),
            "url": request.slate_url,
            "type": "single_email",
            "progress": "Connecting to Dex MCP...",
            "screenshots": [],
            "results": {}
        }
        
        # Start processing in background
        background_tasks.add_task(
            process_single_email_background,
            task_id,
            request.slate_url
        )
        
        return EmailResponse(
            message="Dex MCP email processing initiated",
            task_id=task_id,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error starting Dex email processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start processing: {str(e)}")

@app.post("/api/process-bulk-emails-dex", response_model=EmailResponse)
async def process_bulk_emails_with_dex(request: BulkEmailRequest, background_tasks: BackgroundTasks):
    """Process multiple emails using Dex MCP"""
    task_id = f"dex_bulk_{int(time.time() * 1000)}"
    
    try:
        # Initialize task status
        active_tasks[task_id] = {
            "status": "initializing",
            "start_time": time.time(),
            "url": request.inbox_url,
            "type": "bulk_email",
            "count": request.count,
            "progress": "Connecting to Dex MCP...",
            "screenshots": [],
            "results": {"processed": 0, "total": request.count, "successful": 0, "failed": 0}
        }
        
        # Start processing in background
        background_tasks.add_task(
            process_bulk_emails_background,
            task_id,
            request.inbox_url,
            request.count
        )
        
        return EmailResponse(
            message=f"Dex MCP bulk processing initiated for {request.count} emails",
            task_id=task_id,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error starting bulk email processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start processing: {str(e)}")

@app.get("/api/task-status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get detailed task status with screenshots and progress"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    
    # Calculate duration
    if "end_time" in task_info:
        duration = task_info["end_time"] - task_info["start_time"]
    else:
        duration = time.time() - task_info["start_time"]
    
    return TaskStatusResponse(
        task_id=task_id,
        status=task_info["status"],
        progress=task_info.get("progress", ""),
        duration=f"{duration:.1f}s",
        screenshots=task_info.get("screenshots", []),
        results=task_info.get("results", {}),
        error=task_info.get("error", "")
    )

@app.get("/api/tasks")
async def get_all_tasks():
    """Get all active and completed tasks"""
    return {
        "active_tasks": len([t for t in active_tasks.values() if t["status"] == "running"]),
        "total_tasks": len(active_tasks),
        "tasks": [
            {
                "task_id": task_id,
                "status": info["status"],
                "type": info.get("type", "unknown"),
                "duration": f"{time.time() - info['start_time']:.1f}s" if "end_time" not in info else f"{info['end_time'] - info['start_time']:.1f}s"
            }
            for task_id, info in active_tasks.items()
        ]
    }

@app.delete("/api/task/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a running task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Mark task as cancelled
    active_tasks[task_id]["status"] = "cancelled"
    active_tasks[task_id]["end_time"] = time.time()
    
    # Clean up any associated resources
    await cleanup_dex_client(task_id)
    
    return {"status": "success", "message": f"Task {task_id} cancelled"}

# Background processing functions

async def process_single_email_background(task_id: str, slate_url: str):
    """Background task for processing single email"""
    try:
        # Update status
        active_tasks[task_id]["status"] = "running"
        active_tasks[task_id]["progress"] = "Connecting to browser..."
        
        # Get Dex client
        dex_client = await get_dex_client(task_id)
        
        # Update progress
        active_tasks[task_id]["progress"] = "Processing email..."
        
        # Process email
        result = await dex_client.process_slate_email(slate_url, generate_response_with_agno)
        
        # Update task with results
        active_tasks[task_id]["status"] = "completed" if result.success else "failed"
        active_tasks[task_id]["end_time"] = time.time()
        active_tasks[task_id]["screenshots"] = result.screenshots
        active_tasks[task_id]["results"] = {
            "success": result.success,
            "email_content": result.email_content[:500] + "..." if len(result.email_content) > 500 else result.email_content,
            "generated_response": result.generated_response[:500] + "..." if len(result.generated_response) > 500 else result.generated_response,
            "processing_time": f"{result.processing_time:.2f}s"
        }
        
        if not result.success:
            active_tasks[task_id]["error"] = result.error_message
        
        logger.info(f"Single email processing completed for task {task_id}")
        
    except Exception as e:
        logger.error(f"Error in single email processing: {str(e)}")
        active_tasks[task_id]["status"] = "failed"
        active_tasks[task_id]["end_time"] = time.time()
        active_tasks[task_id]["error"] = str(e)
    finally:
        # Clean up
        await cleanup_dex_client(task_id)

async def process_bulk_emails_background(task_id: str, inbox_url: str, count: int):
    """Background task for processing bulk emails"""
    try:
        # Update status
        active_tasks[task_id]["status"] = "running"
        active_tasks[task_id]["progress"] = "Connecting to browser..."
        
        # Get Dex client
        dex_client = await get_dex_client(task_id)
        
        # Update progress
        active_tasks[task_id]["progress"] = f"Processing {count} emails from inbox..."
        
        # Process emails
        results = await dex_client.process_bulk_emails(inbox_url, count, generate_response_with_agno)
        
        # Compile results
        successful = sum(1 for r in results if r.success)
        failed = len(results) - successful
        all_screenshots = []
        
        for result in results:
            all_screenshots.extend(result.screenshots)
        
        # Update task with results
        active_tasks[task_id]["status"] = "completed"
        active_tasks[task_id]["end_time"] = time.time()
        active_tasks[task_id]["screenshots"] = all_screenshots[:20]  # Limit to 20 screenshots
        active_tasks[task_id]["results"] = {
            "processed": len(results),
            "total": count,
            "successful": successful,
            "failed": failed,
            "success_rate": f"{(successful/len(results)*100):.1f}%" if results else "0%",
            "details": [
                {
                    "success": r.success,
                    "error": r.error_message if not r.success else None,
                    "processing_time": f"{r.processing_time:.2f}s"
                } for r in results[:10]  # Show details for first 10 emails
            ]
        }
        
        logger.info(f"Bulk email processing completed for task {task_id}: {successful}/{len(results)} successful")
        
    except Exception as e:
        logger.error(f"Error in bulk email processing: {str(e)}")
        active_tasks[task_id]["status"] = "failed"
        active_tasks[task_id]["end_time"] = time.time()
        active_tasks[task_id]["error"] = str(e)
    finally:
        # Clean up
        await cleanup_dex_client(task_id)

# Health check and utility endpoints

@app.get("/api/health")
async def health_check():
    """Health check with Dex MCP status"""
    dex_status = "unknown"
    
    try:
        # Test Dex connection
        test_client = DexMCPClient()
        connected = await test_client.connect()
        if connected:
            dex_status = "connected"
            await test_client.disconnect()
        else:
            dex_status = "disconnected"
    except Exception as e:
        dex_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "dex_mcp_status": dex_status,
        "active_tasks": len([t for t in active_tasks.values() if t["status"] == "running"]),
        "total_tasks": len(active_tasks)
    }

@app.get("/api/dex/test-connection")
async def test_dex_connection():
    """Test Dex MCP connection"""
    try:
        client = DexMCPClient()
        connected = await client.connect()
        
        if connected:
            # Test basic functionality
            tabs_result = await client.send_action("get_tabs")
            await client.disconnect()
            
            return {
                "success": True,
                "message": "Dex MCP connection successful",
                "tabs_available": tabs_result.get("result", {}).get("success", False)
            }
        else:
            return {
                "success": False,
                "message": "Failed to connect to Dex MCP server"
            }
            
    except Exception as e:
        return {
            "success": False,
            "message": f"Dex MCP connection error: {str(e)}"
        }

@app.post("/api/admin/clear-tasks")
async def clear_completed_tasks():
    """Clear completed and failed tasks"""
    global active_tasks
    
    # Keep only running tasks
    running_tasks = {
        task_id: info for task_id, info in active_tasks.items() 
        if info["status"] == "running"
    }
    
    cleared_count = len(active_tasks) - len(running_tasks)
    active_tasks = running_tasks
    
    return {
        "status": "success",
        "message": f"Cleared {cleared_count} completed tasks",
        "remaining_tasks": len(active_tasks)
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Enrollment Counselor API with Dex MCP",
        "version": "2.0",
        "features": [
            "Single email processing with Dex MCP",
            "Bulk email processing",
            "Visual feedback with screenshots",
            "Real-time task monitoring",
            "AI-powered response generation"
        ],
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000,
        reload=True,  # Enable for development
        log_level="info"
    )