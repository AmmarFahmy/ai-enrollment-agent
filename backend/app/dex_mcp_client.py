# backend/app/dex_mcp_client.py

import asyncio
import websockets
import json
import logging
import time
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import base64
import re

logger = logging.getLogger(__name__)

@dataclass
class EmailProcessingResult:
    success: bool
    email_content: str
    generated_response: str
    screenshots: List[str]
    error_message: Optional[str] = None
    processing_time: float = 0.0

class DexMCPClient:
    def __init__(self, websocket_url: str = "ws://127.0.0.1:8765"):
        self.websocket_url = websocket_url
        self.websocket = None
        self.connected = False
        
    async def connect(self) -> bool:
        """Connect to Dex MCP WebSocket server"""
        try:
            self.websocket = await websockets.connect(
                self.websocket_url,
                ping_interval=20,
                ping_timeout=10,
                close_timeout=10
            )
            self.connected = True
            logger.info("Connected to Dex MCP server")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Dex MCP: {str(e)}")
            return False
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.websocket and self.connected:
            await self.websocket.close()
            self.connected = False
            logger.info("Disconnected from Dex MCP server")
    
    async def send_action(self, action: str, timeout: int = 30, **kwargs) -> Dict[str, Any]:
        """Send action to Dex MCP and wait for response"""
        if not self.connected:
            raise ConnectionError("Not connected to Dex MCP server")
        
        message = {
            "action": action,
            **kwargs
        }
        
        try:
            logger.info(f"Sending Dex action: {action}")
            await self.websocket.send(json.dumps(message))
            
            # Wait for response with timeout
            response = await asyncio.wait_for(
                self.websocket.recv(), 
                timeout=timeout
            )
            
            result = json.loads(response)
            logger.info(f"Dex action {action} completed: {result.get('result', {}).get('success', False)}")
            return result
            
        except asyncio.TimeoutError:
            logger.error(f"Timeout waiting for Dex action: {action}")
            raise TimeoutError(f"Dex action {action} timed out after {timeout}s")
        except Exception as e:
            logger.error(f"Error in Dex action {action}: {str(e)}")
            raise
    
    async def wait_for_page_load(self, tab_id: Optional[int] = None, wait_time: int = 3):
        """Wait for page to load"""
        await asyncio.sleep(wait_time)
        
        # Take screenshot to verify page loaded
        try:
            screenshot_result = await self.send_action("screenshot", tab_id=tab_id)
            return screenshot_result.get("result", {}).get("success", False)
        except:
            return False
    
    def extract_email_content_from_dom(self, dom_data: Dict) -> str:
        """Extract email content from DOM structure"""
        try:
            processed_output = dom_data.get("result", {}).get("data", {}).get("processedOutput", "")
            
            # Look for common email content patterns
            email_patterns = [
                r'Dear.*?(?=\n\n|\n.*?Best regards|\n.*?Sincerely|\n.*?Thanks|$)',
                r'Hello.*?(?=\n\n|\n.*?Best regards|\n.*?Sincerely|\n.*?Thanks|$)',
                r'Hi.*?(?=\n\n|\n.*?Best regards|\n.*?Sincerely|\n.*?Thanks|$)',
            ]
            
            email_content = ""
            for pattern in email_patterns:
                matches = re.findall(pattern, processed_output, re.DOTALL | re.IGNORECASE)
                if matches:
                    email_content = matches[0].strip()
                    break
            
            if not email_content:
                # Fallback: extract text content
                lines = processed_output.split('\n')
                content_lines = [line.strip() for line in lines if line.strip() and len(line.strip()) > 10]
                email_content = '\n'.join(content_lines[:20])  # First 20 meaningful lines
            
            return email_content
            
        except Exception as e:
            logger.error(f"Error extracting email content: {str(e)}")
            return processed_output[:1000]  # Fallback to first 1000 chars
    
    def find_email_elements(self, dom_data: Dict) -> Dict[str, str]:
        """Find email-related elements (reply button, text area, etc.)"""
        try:
            xpath_map = dom_data.get("result", {}).get("data", {}).get("highlightToXPath", {})
            processed_output = dom_data.get("result", {}).get("data", {}).get("processedOutput", "")
            
            elements = {
                "reply_button": None,
                "text_area": None,
                "send_button": None,
                "email_body": None
            }
            
            # Look for reply/compose elements
            for element_id, xpath in xpath_map.items():
                xpath_lower = xpath.lower()
                
                # Reply button patterns
                if any(pattern in xpath_lower for pattern in ["reply", "respond", "compose"]):
                    if "button" in xpath_lower or "click" in xpath_lower:
                        elements["reply_button"] = element_id
                
                # Text area patterns
                if any(pattern in xpath_lower for pattern in ["textarea", "message", "body", "content"]):
                    if "input" in xpath_lower or "textarea" in xpath_lower:
                        elements["text_area"] = element_id
                
                # Send button patterns
                if any(pattern in xpath_lower for pattern in ["send", "submit"]):
                    if "button" in xpath_lower:
                        elements["send_button"] = element_id
            
            # Alternative: look in processed output for element hints
            if not elements["reply_button"]:
                reply_matches = re.findall(r'(\d+).*?reply', processed_output, re.IGNORECASE)
                if reply_matches:
                    elements["reply_button"] = reply_matches[0]
            
            if not elements["text_area"]:
                textarea_matches = re.findall(r'(\d+).*?textarea', processed_output, re.IGNORECASE)
                if textarea_matches:
                    elements["text_area"] = textarea_matches[0]
            
            logger.info(f"Found elements: {elements}")
            return elements
            
        except Exception as e:
            logger.error(f"Error finding email elements: {str(e)}")
            return {"reply_button": None, "text_area": None, "send_button": None, "email_body": None}
    
    async def process_slate_email(self, slate_url: str, generate_response_func) -> EmailProcessingResult:
        """Process a single Slate email with complete workflow"""
        start_time = time.time()
        screenshots = []
        
        try:
            logger.info(f"Starting Slate email processing: {slate_url}")
            
            # Step 1: Open new tab with Slate URL
            logger.info("Opening Slate URL...")
            tab_result = await self.send_action("new_tab", url=slate_url)
            
            if not tab_result.get("result", {}).get("success"):
                raise Exception("Failed to open new tab")
            
            tab_id = tab_result["result"]["data"]["id"]
            logger.info(f"Opened tab {tab_id}")
            
            # Step 2: Wait for page load and take initial screenshot
            await self.wait_for_page_load(tab_id, 5)
            
            initial_screenshot = await self.send_action("screenshot", tab_id=tab_id)
            if initial_screenshot.get("result", {}).get("success"):
                screenshots.append(initial_screenshot["result"]["data"])
            
            # Step 3: Get DOM structure to analyze page
            logger.info("Analyzing page structure...")
            dom_result = await self.send_action("grab_dom", tab_id=tab_id)
            
            if not dom_result.get("result", {}).get("success"):
                raise Exception("Failed to get DOM structure")
            
            # Step 4: Extract email content
            logger.info("Extracting email content...")
            email_content = self.extract_email_content_from_dom(dom_result)
            
            if not email_content or len(email_content.strip()) < 10:
                raise Exception("Could not extract meaningful email content")
            
            logger.info(f"Extracted email content: {email_content[:200]}...")
            
            # Step 5: Generate response using AI
            logger.info("Generating AI response...")
            generated_response = await generate_response_func(email_content)
            
            if not generated_response:
                raise Exception("Failed to generate response")
            
            logger.info(f"Generated response: {generated_response[:200]}...")
            
            # Step 6: Find reply elements
            logger.info("Finding reply elements...")
            elements = self.find_email_elements(dom_result)
            
            # Step 7: Click reply button if found
            if elements["reply_button"]:
                logger.info(f"Clicking reply button: {elements['reply_button']}")
                reply_result = await self.send_action(
                    "click_element", 
                    element_id=elements["reply_button"], 
                    tab_id=tab_id
                )
                
                if reply_result.get("result", {}).get("success"):
                    # Wait for reply interface to load
                    await asyncio.sleep(2)
                    
                    # Get updated DOM after clicking reply
                    updated_dom = await self.send_action("grab_dom", tab_id=tab_id)
                    elements = self.find_email_elements(updated_dom)
            
            # Step 8: Input the generated response
            if elements["text_area"]:
                logger.info(f"Inputting response to text area: {elements['text_area']}")
                input_result = await self.send_action(
                    "input_text",
                    element_id=elements["text_area"],
                    text=generated_response,
                    tab_id=tab_id
                )
                
                if input_result.get("result", {}).get("success"):
                    logger.info("Successfully input response text")
                else:
                    logger.warning("Failed to input response text")
            else:
                logger.warning("Could not find text area for response")
            
            # Step 9: Take final screenshot
            final_screenshot = await self.send_action("capture_with_highlights", tab_id=tab_id)
            if final_screenshot.get("result", {}).get("success"):
                screenshots.append(final_screenshot["result"]["data"]["dataUrl"])
            
            processing_time = time.time() - start_time
            
            return EmailProcessingResult(
                success=True,
                email_content=email_content,
                generated_response=generated_response,
                screenshots=screenshots,
                processing_time=processing_time
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Error processing email: {str(e)}"
            logger.error(error_msg)
            
            return EmailProcessingResult(
                success=False,
                email_content="",
                generated_response="",
                screenshots=screenshots,
                error_message=error_msg,
                processing_time=processing_time
            )
    
    async def process_bulk_emails(self, inbox_url: str, count: int, generate_response_func) -> List[EmailProcessingResult]:
        """Process multiple emails from inbox"""
        results = []
        
        try:
            logger.info(f"Starting bulk email processing: {count} emails from {inbox_url}")
            
            # Open inbox
            tab_result = await self.send_action("new_tab", url=inbox_url)
            if not tab_result.get("result", {}).get("success"):
                raise Exception("Failed to open inbox")
            
            tab_id = tab_result["result"]["data"]["id"]
            await self.wait_for_page_load(tab_id, 5)
            
            # Get inbox DOM to find email links
            inbox_dom = await self.send_action("grab_dom", tab_id=tab_id)
            email_links = self.find_email_links_in_inbox(inbox_dom)
            
            # Process up to 'count' emails
            emails_to_process = min(count, len(email_links))
            logger.info(f"Found {len(email_links)} emails, processing {emails_to_process}")
            
            for i in range(emails_to_process):
                try:
                    logger.info(f"Processing email {i+1}/{emails_to_process}")
                    
                    # Click on email link
                    click_result = await self.send_action(
                        "click_element",
                        element_id=email_links[i],
                        tab_id=tab_id
                    )
                    
                    if click_result.get("result", {}).get("success"):
                        await asyncio.sleep(3)  # Wait for email to load
                        
                        # Process this email (get current URL and process)
                        current_url = await self.get_current_url(tab_id)
                        result = await self.process_slate_email(current_url, generate_response_func)
                        results.append(result)
                        
                        # Go back to inbox
                        await self.send_action("send_keys", keys="Alt+Left", tab_id=tab_id)
                        await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Error processing email {i+1}: {str(e)}")
                    results.append(EmailProcessingResult(
                        success=False,
                        email_content="",
                        generated_response="",
                        screenshots=[],
                        error_message=str(e)
                    ))
            
        except Exception as e:
            logger.error(f"Error in bulk email processing: {str(e)}")
        
        return results
    
    def find_email_links_in_inbox(self, dom_data: Dict) -> List[str]:
        """Find clickable email links in inbox"""
        try:
            xpath_map = dom_data.get("result", {}).get("data", {}).get("highlightToXPath", {})
            
            email_links = []
            for element_id, xpath in xpath_map.items():
                # Look for links that might be emails
                if any(pattern in xpath.lower() for pattern in ["mail", "message", "subject", "inbox"]):
                    if "a" in xpath.lower() or "link" in xpath.lower():
                        email_links.append(element_id)
            
            return email_links[:10]  # Limit to first 10 emails
            
        except Exception as e:
            logger.error(f"Error finding email links: {str(e)}")
            return []
    
    async def get_current_url(self, tab_id: int) -> str:
        """Get current URL of the tab"""
        try:
            tabs_result = await self.send_action("get_tabs")
            if tabs_result.get("result", {}).get("success"):
                tabs = tabs_result["result"]["data"]
                for tab in tabs:
                    if tab["id"] == tab_id:
                        return tab["url"]
            return ""
        except:
            return ""