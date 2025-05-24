from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import asynccontextmanager
from pydantic import BaseModel
import asyncio
import os
from dotenv import load_dotenv
import platform
import logging
from functools import lru_cache
import time

# Try to import browser-use components
try:
    from browser_use import Agent as BrowserAgent, Browser, BrowserConfig, Controller
    from langchain_google_genai import ChatGoogleGenerativeAI
    BROWSER_USE_AVAILABLE = True
except ImportError:
    BROWSER_USE_AVAILABLE = False
    
# Import Agno-related components
from agno.agent import Agent as AgnoAgent
from agno.models.google import Gemini
from app.agno_manager.knowledge_base import knowledge_base
from app.optimized_chat_endpoint import add_chat_endpoint

# backend/main.py (modification)

# Add this import
from app.knowledge_endpoint import router as knowledge_router

# Add this line after creating the FastAPI app

# Load environment variables once at startup
load_dotenv()

# Configure logging with optimization for production
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
    # Initialize knowledge base before serving requests
    initialize_knowledge_base()
    # Pre-load the agent model to avoid cold start
    _ = get_agno_agent()
    yield
    # Clean up resources at shutdown
    pass

# Create FastAPI app with lifespan
app = FastAPI(
    title="Email Processing API",
    lifespan=lifespan,
)

# Enable CORS with optimized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge_router)


# Browser instance pool for reuse (to avoid startup costs)
browser_pool = []
MAX_POOL_SIZE = 2  # Adjust based on server resources

# Initialize and load knowledge base once at startup
def initialize_knowledge_base():
    """Initialize knowledge base with optimized settings for speed"""
    logger.info("Initializing knowledge base at application startup")
    try:
        # Load with caching enabled
        knowledge_base.load(recreate=True)
        logger.info("Knowledge base successfully loaded")
    except Exception as e:
        logger.error(f"Failed to load knowledge base: {str(e)}")
        # Continue running even if knowledge base fails - don't crash the server

# Pydantic models for requests/responses
class EmailRequest(BaseModel):
    slate_url: str

class EmailResponse(BaseModel):
    message: str
    task_id: str = ""  # Add task ID for client tracking

class ErrorResponse(BaseModel):
    error: str

# Add chat endpoint
add_chat_endpoint(app)

# Global state for the Agno agent to avoid recreating it
agno_agent = None

# LRU cache to store response templates for common queries
response_cache = {}

@lru_cache(maxsize=1)  # Singleton pattern with LRU cache
def get_agno_agent():
    """Get or create the Agno agent (singleton pattern with caching)"""
    global agno_agent
    if agno_agent is None:
        logger.info("Initializing Agno agent")
        start_time = time.time()
        agno_agent = AgnoAgent(
            model=Gemini(
                id="gemini-2.0-flash", 
                api_key=API_KEY,
                # Add parameters for faster response
                temperature=0.2,  # Lower temperature for more deterministic responses
            ),
            role="Your role is Graduate enrollment counsellor of Illinois institude of technology chicago and you assist students in their queries.",
            knowledge=knowledge_base,
            search_knowledge=True,
        )
        logger.info(f"Agno agent initialized in {time.time() - start_time:.2f} seconds")
    return agno_agent

# Track active tasks to avoid resource contention
active_tasks = {}

# Function to generate response using Agno Agent with Gemini - optimized
async def generate_response_with_agno(question: str) -> str:
    """Generate a response to an email using Agno agent with Gemini model"""
    # Check cache first
    cache_key = hash(question.strip().lower())
    if cache_key in response_cache:
        logger.info("Using cached response")
        return response_cache[cache_key]
    
    try:
        # Get the agent - already initialized
        agent = get_agno_agent()
        
        # Optimized prompt (shorter for faster processing)
        prompt = (
            f"You are a graduate enrollment counselor at Illinois Institute of Technology."
            f"Search knowledge base and draft a formatted email ( no asterisks) response without an subject to: {question}\n"
            f"Be concise, professional, and make up a valid response (except email addresses and link) if you dont find anything related in knowledge."
        )
        
        # Set a timeout for the agent run to prevent hanging
        start_time = time.time()
        result = await asyncio.wait_for(
            agent.arun(prompt),  # Use async version if available
            timeout=300  # 15 second timeout
        )
        
        response_time = time.time() - start_time
        logger.info(f"Response generated in {response_time:.2f} seconds")
        
        # Get response content
        response_content = result.content
        
        # Cache the response for future use if it's a common query
        if response_time < 5.0:  # Only cache fast responses (likely common queries)
            response_cache[cache_key] = response_content
            
        return response_content
    
    except asyncio.TimeoutError:
        logger.error("Response generation timed out")
        return "I apologize, but I'm unable to generate a response at this time due to high demand. Please try again later."
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "I apologize, but I'm unable to generate a response at this time. Please try again later."

async def get_browser_from_pool():
    """Get a browser from the pool or create a new one"""
    if browser_pool:
        return browser_pool.pop()
    else:
        # Configure browser for speed
        chrome_path = get_chrome_path()
        config = BrowserConfig(
            chrome_instance_path=chrome_path,
            headless=True,  # Headless mode for speed
            disable_security=True,  # Disable security for speed (use with caution)
            extra_browser_args=[
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
                "--disable-extensions",
                "--disable-logging",
                "--disable-web-security",
                "--blink-settings=imagesEnabled=false",  # Disable images for speed
            ]
        )
        return Browser(config=config)

async def return_browser_to_pool(browser):
    """Return a browser to the pool for reuse"""
    if len(browser_pool) < MAX_POOL_SIZE:
        browser_pool.append(browser)
    else:
        await browser.close()

@app.post("/api/process-email", response_model=EmailResponse)
async def process_email(request: EmailRequest, background_tasks: BackgroundTasks):
    """Endpoint to process emails using browser-use - optimized"""
    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(
            status_code=501, 
            detail="Browser-use framework is not available. Please install required dependencies."
        )
    
    # Generate a unique task ID
    task_id = f"task_{int(time.time() * 1000)}"
    
    try:
        # Get a browser from the pool
        browser = await get_browser_from_pool()
        
        # Initialize controller with optimized settings
        controller = Controller()
        
        # Create storage for the extracted email content
        email_content = {"value": ""}
        
        # Register the function to process email content - optimized for speed
        @controller.action("Process Email Content")
        async def process_email_content(content: str) -> str:
            """Process the email content and generate a response"""
            # Save the content
            email_content["value"] = content
            
            # Generate a response with timeout
            response = await generate_response_with_agno(content)
            
            # Return the exact response to be used
            return response
        
        initial_actions = [
            {'go_to_url': {'url': f'{request.slate_url}'}},
        ]
        # Create the agent with optimized settings
        email_agent = BrowserAgent(
            task=f"""
                Click on the email to veiw it. Extract the full email message. Call process_email_content() with the content.
                After receiving the response, find the reply area, paste the EXACT response, do not send.
            """,  # Simplified task for speed
            llm=ChatGoogleGenerativeAI(
                model='gemini-2.5-pro-preview-03-25',
                temperature=0.2,  # Lower temperature for faster responses
                max_tokens=2048,  # Limit token count for speed
            ),
            browser=browser,
            use_vision=True,  # Keep vision for accuracy
            enable_memory=False,  # Disable memory for speed
            controller=controller,
            initial_actions=initial_actions,
            # max_steps=15,  # Limit steps for speed
        )
        
        # Run the agent in background to return response quickly
        active_tasks[task_id] = {
            "status": "running",
            "start_time": time.time(),
            "url": request.slate_url,
        }
        
        # Use background tasks to run the agent without blocking
        background_tasks.add_task(
            run_agent_with_cleanup, 
            email_agent, 
            browser, 
            task_id, 
            active_tasks,
            return_browser_to_pool
        )
        
        # Return immediately with task ID
        return EmailResponse(
            message="Browser has been launched to process the email. The AI will read the email and draft a response.",
            task_id=task_id,
        )
        
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        # Attempt to return browser to pool even on error
        if 'browser' in locals():
            try:
                await return_browser_to_pool(browser)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error processing email: {str(e)}")
    
@app.post("/api/process-bulk-email", response_model=EmailResponse)
async def process_bulk_email(request: EmailRequest, background_tasks: BackgroundTasks):
    """Endpoint to process emails using browser-use - optimized"""
    
    request.slate_url = "https://apply.illinoistech.edu/manage/inbox/"

    if not BROWSER_USE_AVAILABLE:
        raise HTTPException(
            status_code=501, 
            detail="Browser-use framework is not available. Please install required dependencies."
        )
    
    # Generate a unique task ID
    task_id = f"task_{int(time.time() * 1000)}"
    
    try:
        # Get a browser from the pool
        browser = await get_browser_from_pool()
        
        # Initialize controller with optimized settings
        controller = Controller()
        
        # Create storage for the extracted email content
        email_content = {"value": ""}
        
        # Register the function to process email content - optimized for speed
        @controller.action("Process Email Content")
        async def process_email_content(content: str) -> str:
            """Process the email content and generate a response"""
            # Save the content
            email_content["value"] = content
            
            # Generate a response with timeout
            response = await generate_response_with_agno(content)
            
            # Return the exact response to be used
            return response
        
        initial_actions = [
            {'go_to_url': {'url': f'{request.slate_url}'}},
        ]
        # Create the agent with optimized settings
        email_agent = BrowserAgent(
            task=f"""
                You are email processing agent. Your task is to process emails in the inbox.
                Click on the email to veiw it. Extract the full email message. Call process_email_content() with the content.
                After receiving the response, find the reply area, paste the EXACT response, do not send.
                Go back on the inbox page and repeat the process for the next 4 emails.

            """,  # Simplified task for speed
            llm=ChatGoogleGenerativeAI(
                model='gemini-2.5-pro-preview-03-25',
                temperature=0.2,  # Lower temperature for faster responses
                max_tokens=2048,  # Limit token count for speed
            ),
            browser=browser,
            use_vision=True,  # Keep vision for accuracy
            enable_memory=False,  # Disable memory for speed
            controller=controller,
            initial_actions=initial_actions,
            # max_steps=15,  # Limit steps for speed
        )
        
        # Run the agent in background to return response quickly
        active_tasks[task_id] = {
            "status": "running",
            "start_time": time.time(),
            "url": request.slate_url,
        }
        
        # Use background tasks to run the agent without blocking
        background_tasks.add_task(
            run_agent_with_cleanup, 
            email_agent, 
            browser, 
            task_id, 
            active_tasks,
            return_browser_to_pool
        )
        
        # Return immediately with task ID
        return EmailResponse(
            message="Browser has been launched to process the email. The AI will read the email and draft a response.",
            task_id=task_id,
        )
        
    except Exception as e:
        logger.error(f"Error processing email: {str(e)}")
        # Attempt to return browser to pool even on error
        if 'browser' in locals():
            try:
                await return_browser_to_pool(browser)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error processing email: {str(e)}")

async def run_agent_with_cleanup(agent, browser, task_id, active_tasks, return_browser_func):
    """Run the agent and clean up resources when done"""
    try:
        # Run with timeout to prevent hanging
        await asyncio.wait_for(
            agent.run(),
            timeout=120  # 2 minute timeout
        )
        active_tasks[task_id]["status"] = "completed"
    except Exception as e:
        logger.error(f"Error in agent execution: {str(e)}")
        active_tasks[task_id]["status"] = "failed"
    finally:
        active_tasks[task_id]["end_time"] = time.time()
        # Keep browser session open for only 2 minutes instead of 5
        await asyncio.sleep(120)
        # Return browser to pool for reuse
        await return_browser_func(browser)

# Add new endpoint to check task status
@app.get("/api/task/{task_id}")
async def get_task_status(task_id: str):
    """Get the status of a running task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = active_tasks[task_id]
    
    # Calculate duration if task is completed
    if "end_time" in task_info:
        duration = task_info["end_time"] - task_info["start_time"]
    else:
        duration = time.time() - task_info["start_time"]
    
    return {
        "task_id": task_id,
        "status": task_info["status"],
        "duration": f"{duration:.2f} seconds",
        "url": task_info["url"],
    }

@lru_cache(maxsize=4)  # Cache Chrome path detection
def get_chrome_path():
    """Detect the Chrome browser path based on the operating system with caching"""
    system = platform.system()
    
    if system == "Windows":
        possible_paths = [
            os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
            os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe")
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
    
    elif system == "Darwin":  # macOS
        return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    
    else:  # Linux and others
        possible_paths = [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
    
    return "/usr/bin/google-chrome"

# Add endpoint to clear cache (useful for troubleshooting)
@app.post("/api/admin/clear-cache")
async def clear_cache():
    """Clear all caches to refresh the system"""
    global response_cache
    response_cache = {}
    get_chrome_path.cache_clear()
    get_agno_agent.cache_clear()
    return {"status": "Cache cleared successfully"}

# Simple health check endpoint (optimized)
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Root endpoint (optimized)
@app.get("/")
async def root():
    return {"message": "AI Enrollment Counselor API is running", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    # Configure uvicorn for production-level performance
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000,
        workers=4,  # Use multiple workers for parallelism
        loop="uvloop",  # Use faster event loop if available
        log_level="info",
        access_log=False,  # Disable access logging for speed
    )