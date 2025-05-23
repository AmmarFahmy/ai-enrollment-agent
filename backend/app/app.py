from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os
import subprocess
import sys
from dotenv import load_dotenv
from browser_use import Agent, Browser, BrowserConfig
from langchain_openai import ChatOpenAI

# Load environment variables (for credentials)
load_dotenv()

# Create FastAPI app
app = FastAPI(title="Email Processing API")

# Enable CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model for processing emails
class EmailRequest(BaseModel):
    slate_url: str

# Response models
class EmailResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error: str

async def generate_response_with_second_agent(question):
    """
    This function will take a question extracted by browser-use agent
    and generate a response using your second agent (Gemini, GPT, etc.)
    """
    try:
        # Initialize your second agent here
        second_agent = ChatGoogleGenerativeAI(model='gemini-1.5-pro')
        
        # Generate response to the question
        response = await second_agent.ainvoke(f"""
            You are a helpful assistant responding to student emails for a university.
            Please provide a professional, helpful response to this question:
            
            {question}
            
            Format your response with a proper greeting and sign-off.
            Be concise but thorough in addressing the student's concerns.
        """)
        
        # Return the formatted response
        return response
    except Exception as e:
        print(f"Error generating response: {str(e)}")
        return "I apologize, but I'm unable to generate a response at this time. Please try again later."


@app.post("/api/process-email", response_model=EmailResponse)
async def process_email(request: EmailRequest):
 
    try:
        # Configure the browser - update path according to your environment
        browser = Browser(
            config=BrowserConfig(
                # Path to Chrome executable
                chrome_instance_path='/usr/bin/google-chrome',  # Update for your OS
            )
        )

        async def get_response_for_question(question):
            """This function will be registered with browser-use and called by the agent"""
            print(f"Received question: {question}")
            response = await generate_response_with_second_agent(question)
            print(f"Generated response (first 1000 chars): {response[:1000]}...")
            return response

        # Create the agent with browser access
        agent = Agent(
            task=f"""
                Access the url at {request.slate_url}.
                Read the content of the email carefully to understand what the sender is asking.
                
                Step 1: Extract the full email message from the email.
                
                Step 2: Call the function 'get_response_for_question' with the extracted question as the argument.
                For example: get_response_for_question("How do I apply for financial aid?")
                
                Step 3: The function will return a response. Wait for this response.
                
                Step 4: After receiving the response:
                - Find the reply button or area
                - Click it to open the reply field
                - Copy and paste the EXACT response returned from the function
                - Do not modify the response in any way
                - Do not send the email - stop after composing the reply so a human can review it first
                
                Important: Do not generate your own response. Use exactly what is returned by the function.
            """,
            llm=ChatOpenAI(model='gpt-4o'),
            browser=browser,
        )
        
        # Create a task that will run the agent
        task = asyncio.create_task(run_agent(agent, browser))
        
        # Wait for a bit to let the browser launch, but don't block the API response
        # In a production environment, you would implement websockets for real-time updates
        await asyncio.sleep(2)
        
        return EmailResponse(
            message="Browser has been launched to process the email. The AI will read the email and draft a response. Please do not close the browser window until processing is complete."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing email: {str(e)}")

async def run_agent(agent, browser):
    """Run the agent in a separate task."""
    try:
        await agent.run()
        # Wait for user interaction in a real application
        # In this implementation, the browser will remain open
        # In production, you might implement a way to notify when processing is complete
        await asyncio.sleep(300)  # Keep browser open for 5 minutes
    finally:
        await browser.close()

