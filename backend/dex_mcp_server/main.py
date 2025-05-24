# backend/dex_mcp_server/main.py

import asyncio
import websockets
import json
import logging
from typing import Dict, Any, Optional, Set
import time
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class BrowserTab:
    id: int
    title: str
    url: str
    active: bool = False

@dataclass
class ActionRequest:
    id: str
    action: str
    params: Dict[str, Any]
    timestamp: float
    client_id: str

@dataclass
class ActionResponse:
    id: str
    success: bool
    data: Any = None
    message: str = ""
    error: str = ""
    timestamp: float = 0.0

class DexMCPServer:
    def __init__(self, host="127.0.0.1", port=8765):
        self.host = host
        self.port = port
        self.clients: Set[websockets.WebSocketServerProtocol] = set()
        self.browser_clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.pending_requests: Dict[str, ActionRequest] = {}
        self.tabs: Dict[int, BrowserTab] = {}
        self.active_tab_id: Optional[int] = None
        
    async def register_client(self, websocket):
        """Register a new client connection"""
        self.clients.add(websocket)
        client_id = f"client_{len(self.clients)}_{int(time.time())}"
        self.browser_clients[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total clients: {len(self.clients)}")
        return client_id
        
    async def unregister_client(self, websocket):
        """Unregister a client connection"""
        self.clients.discard(websocket)
        
        # Remove from browser_clients
        client_to_remove = None
        for client_id, ws in self.browser_clients.items():
            if ws == websocket:
                client_to_remove = client_id
                break
        
        if client_to_remove:
            del self.browser_clients[client_to_remove]
            
        logger.info(f"Client disconnected. Total clients: {len(self.clients)}")
    
    def generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{uuid.uuid4().hex[:8]}_{int(time.time())}"
    
    async def handle_message(self, websocket, message: str, client_id: str) -> Dict[str, Any]:
        """Handle incoming message from browser extension or API client"""
        try:
            data = json.loads(message)
            action = data.get("action")
            request_id = data.get("id", self.generate_request_id())
            
            logger.info(f"Received action: {action} from client {client_id}")
            
            # Create action request
            action_request = ActionRequest(
                id=request_id,
                action=action,
                params=data,
                timestamp=time.time(),
                client_id=client_id
            )
            
            # Handle different action types
            if action == "get_tabs":
                return await self.handle_get_tabs(action_request)
            elif action == "screenshot":
                return await self.handle_screenshot(action_request)
            elif action == "new_tab":
                return await self.handle_new_tab(action_request)
            elif action == "navigate":
                return await self.handle_navigate(action_request)
            elif action == "click_element":
                return await self.handle_click_element(action_request)
            elif action == "input_text":
                return await self.handle_input_text(action_request)
            elif action == "grab_dom":
                return await self.handle_grab_dom(action_request)
            elif action == "capture_with_highlights":
                return await self.handle_capture_with_highlights(action_request)
            elif action == "send_keys":
                return await self.handle_send_keys(action_request)
            elif action == "select_tab":
                return await self.handle_select_tab(action_request)
            elif action == "close_tab":
                return await self.handle_close_tab(action_request)
            elif action == "search_google":
                return await self.handle_search_google(action_request)
            elif action == "wait":
                return await self.handle_wait(action_request)
            else:
                return self.create_error_response(
                    request_id, 
                    f"Unknown action: {action}"
                )
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return self.create_error_response("unknown", "Invalid JSON message")
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")
            return self.create_error_response("unknown", f"Server error: {str(e)}")
    
    def create_success_response(self, request_id: str, data: Any = None, message: str = "") -> Dict[str, Any]:
        """Create successful response"""
        return {
            "id": request_id,
            "result": {
                "success": True,
                "data": data,
                "message": message,
                "timestamp": time.time()
            }
        }
    
    def create_error_response(self, request_id: str, error_message: str) -> Dict[str, Any]:
        """Create error response"""
        return {
            "id": request_id,
            "result": {
                "success": False,
                "error": error_message,
                "timestamp": time.time()
            }
        }
    
    async def handle_get_tabs(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle get all tabs request"""
        try:
            # Mock tabs data - in real implementation, browser extension would provide this
            mock_tabs = [
                {"id": 1, "title": "Gmail", "url": "https://mail.google.com", "active": True},
                {"id": 2, "title": "Slate - Illinois Tech", "url": "https://apply.illinoistech.edu", "active": False},
                {"id": 3, "title": "Google", "url": "https://google.com", "active": False}
            ]
            
            # Update internal tab tracking
            for tab_data in mock_tabs:
                tab = BrowserTab(
                    id=tab_data["id"],
                    title=tab_data["title"],
                    url=tab_data["url"],
                    active=tab_data["active"]
                )
                self.tabs[tab.id] = tab
                if tab.active:
                    self.active_tab_id = tab.id
            
            return self.create_success_response(
                request.id,
                data=mock_tabs,
                message="Tabs retrieved successfully"
            )
            
        except Exception as e:
            logger.error(f"Error getting tabs: {str(e)}")
            return self.create_error_response(request.id, f"Failed to get tabs: {str(e)}")
    
    async def handle_screenshot(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle screenshot request"""
        try:
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            # Mock base64 screenshot data
            mock_screenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            
            return self.create_success_response(
                request.id,
                data=mock_screenshot,
                message=f"Screenshot captured for tab {tab_id}"
            )
            
        except Exception as e:
            logger.error(f"Error taking screenshot: {str(e)}")
            return self.create_error_response(request.id, f"Screenshot failed: {str(e)}")
    
    async def handle_new_tab(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle new tab creation"""
        try:
            url = request.params.get("url", "about:blank")
            new_tab_id = max(self.tabs.keys(), default=0) + 1
            
            # Create new tab
            new_tab = BrowserTab(
                id=new_tab_id,
                title="New Tab",
                url=url,
                active=True
            )
            
            # Update tabs
            for tab in self.tabs.values():
                tab.active = False
            
            self.tabs[new_tab_id] = new_tab
            self.active_tab_id = new_tab_id
            
            return self.create_success_response(
                request.id,
                data={"id": new_tab_id, "url": url},
                message=f"New tab created with ID {new_tab_id}"
            )
            
        except Exception as e:
            logger.error(f"Error creating new tab: {str(e)}")
            return self.create_error_response(request.id, f"Failed to create tab: {str(e)}")
    
    async def handle_navigate(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle navigation request"""
        try:
            url = request.params.get("url", "")
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if not url:
                return self.create_error_response(request.id, "URL is required")
            
            # Update tab URL
            if tab_id in self.tabs:
                self.tabs[tab_id].url = url
                # Update title based on URL
                if "google.com" in url:
                    self.tabs[tab_id].title = "Google"
                elif "illinoistech.edu" in url:
                    self.tabs[tab_id].title = "Illinois Tech"
                elif "gmail.com" in url:
                    self.tabs[tab_id].title = "Gmail"
                else:
                    self.tabs[tab_id].title = "Loading..."
            
            return self.create_success_response(
                request.id,
                data={"url": url, "tab_id": tab_id},
                message=f"Navigated to {url}"
            )
            
        except Exception as e:
            logger.error(f"Error navigating: {str(e)}")
            return self.create_error_response(request.id, f"Navigation failed: {str(e)}")
    
    async def handle_click_element(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle element click"""
        try:
            element_id = request.params.get("element_id", "")
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if not element_id:
                return self.create_error_response(request.id, "Element ID is required")
            
            return self.create_success_response(
                request.id,
                data={"element_id": element_id, "tab_id": tab_id},
                message=f"Clicked element {element_id}"
            )
            
        except Exception as e:
            logger.error(f"Error clicking element: {str(e)}")
            return self.create_error_response(request.id, f"Click failed: {str(e)}")
    
    async def handle_input_text(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle text input"""
        try:
            element_id = request.params.get("element_id", "")
            text = request.params.get("text", "")
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if not element_id:
                return self.create_error_response(request.id, "Element ID is required")
            
            return self.create_success_response(
                request.id,
                data={
                    "element_id": element_id, 
                    "text": text[:100] + ("..." if len(text) > 100 else ""),
                    "tab_id": tab_id
                },
                message=f"Text input to element {element_id}"
            )
            
        except Exception as e:
            logger.error(f"Error inputting text: {str(e)}")
            return self.create_error_response(request.id, f"Text input failed: {str(e)}")
    
    async def handle_grab_dom(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle DOM extraction"""
        try:
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            # Mock DOM structure for different sites
            current_url = self.tabs.get(tab_id, BrowserTab(0, "", "")).url
            
            if "illinoistech.edu" in current_url or "slate" in current_url.lower():
                # Mock Slate interface
                mock_dom = {
                    "processedOutput": """Page Structure:
1. Email Subject: "Question about MS Robotics Program"
2. Reply Button (Click to respond)  
3. Email Body: "Dear Admissions, I have questions about the MS in Robotics program. What are the admission requirements and tuition costs? Best regards, John Smith"
4. Text Area: (For composing response)
5. Send Button
6. Back to Inbox""",
                    "highlightToXPath": {
                        "1": "/html/body/div[@class='email-subject']",
                        "2": "/html/body/button[@id='reply-btn']",
                        "3": "/html/body/div[@class='email-content']", 
                        "4": "/html/body/textarea[@id='response-text']",
                        "5": "/html/body/button[@id='send-btn']",
                        "6": "/html/body/a[@class='back-link']"
                    },
                    "html": f"<html><head><title>Slate Email Interface</title></head><body><div class='email-interface'>Mock Slate content for {current_url}</div></body></html>"
                }
            else:
                # Generic page structure
                mock_dom = {
                    "processedOutput": """Page Elements:
1. Navigation Menu
2. Main Content Area  
3. Search Box
4. Login Button
5. Footer Links""",
                    "highlightToXPath": {
                        "1": "/html/body/nav",
                        "2": "/html/body/main",
                        "3": "/html/body/input[@type='search']",
                        "4": "/html/body/button[@class='login']",
                        "5": "/html/body/footer"
                    },
                    "html": f"<html><head><title>Generic Page</title></head><body><div>Generic content for {current_url}</div></body></html>"
                }
            
            return self.create_success_response(
                request.id,
                data=mock_dom,
                message="DOM extracted successfully"
            )
            
        except Exception as e:
            logger.error(f"Error grabbing DOM: {str(e)}")
            return self.create_error_response(request.id, f"DOM extraction failed: {str(e)}")
    
    async def handle_capture_with_highlights(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle screenshot with highlights"""
        try:
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            # Mock screenshot with highlights
            mock_data = {
                "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "highlightCount": 6,
                "highlights": [
                    {"id": "1", "type": "text", "bounds": {"x": 10, "y": 50, "width": 200, "height": 30}},
                    {"id": "2", "type": "button", "bounds": {"x": 220, "y": 50, "width": 80, "height": 30}},
                    {"id": "3", "type": "textarea", "bounds": {"x": 10, "y": 100, "width": 300, "height": 100}},
                    {"id": "4", "type": "button", "bounds": {"x": 250, "y": 210, "width": 60, "height": 30}},
                    {"id": "5", "type": "link", "bounds": {"x": 10, "y": 250, "width": 100, "height": 20}},
                    {"id": "6", "type": "input", "bounds": {"x": 320, "y": 10, "width": 150, "height": 25}}
                ]
            }
            
            return self.create_success_response(
                request.id,
                data=mock_data,
                message=f"Screenshot with {mock_data['highlightCount']} highlights captured"
            )
            
        except Exception as e:
            logger.error(f"Error capturing with highlights: {str(e)}")
            return self.create_error_response(request.id, f"Highlight capture failed: {str(e)}")
    
    async def handle_send_keys(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle keyboard input"""
        try:
            keys = request.params.get("keys", "")
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if not keys:
                return self.create_error_response(request.id, "Keys parameter is required")
            
            return self.create_success_response(
                request.id,
                data={"keys": keys, "tab_id": tab_id},
                message=f"Sent key sequence: {keys}"
            )
            
        except Exception as e:
            logger.error(f"Error sending keys: {str(e)}")
            return self.create_error_response(request.id, f"Send keys failed: {str(e)}")
    
    async def handle_select_tab(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle tab selection"""
        try:
            tab_id = request.params.get("tab_id")
            
            if tab_id is None:
                return self.create_error_response(request.id, "Tab ID is required")
            
            tab_id = int(tab_id)
            
            if tab_id not in self.tabs:
                return self.create_error_response(request.id, f"Tab {tab_id} not found")
            
            # Update active tab
            for tab in self.tabs.values():
                tab.active = False
            
            self.tabs[tab_id].active = True
            self.active_tab_id = tab_id
            
            return self.create_success_response(
                request.id,
                data={"tab_id": tab_id, "title": self.tabs[tab_id].title},
                message=f"Selected tab {tab_id}"
            )
            
        except ValueError:
            return self.create_error_response(request.id, "Invalid tab ID format")
        except Exception as e:
            logger.error(f"Error selecting tab: {str(e)}")
            return self.create_error_response(request.id, f"Tab selection failed: {str(e)}")
    
    async def handle_close_tab(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle tab closing"""
        try:
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if tab_id is None:
                return self.create_error_response(request.id, "No tab to close")
            
            tab_id = int(tab_id)
            
            if tab_id in self.tabs:
                del self.tabs[tab_id]
                
                # Update active tab if we closed the active one
                if self.active_tab_id == tab_id:
                    if self.tabs:
                        self.active_tab_id = next(iter(self.tabs.keys()))
                        self.tabs[self.active_tab_id].active = True
                    else:
                        self.active_tab_id = None
            
            return self.create_success_response(
                request.id,
                data={"closed_tab_id": tab_id},
                message=f"Closed tab {tab_id}"
            )
            
        except Exception as e:
            logger.error(f"Error closing tab: {str(e)}")
            return self.create_error_response(request.id, f"Tab close failed: {str(e)}")
    
    async def handle_search_google(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle Google search"""
        try:
            query = request.params.get("query", "")
            tab_id = request.params.get("tab_id", self.active_tab_id)
            
            if not query:
                return self.create_error_response(request.id, "Search query is required")
            
            # Simulate navigation to Google search
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            
            if tab_id in self.tabs:
                self.tabs[tab_id].url = search_url
                self.tabs[tab_id].title = f"Google Search: {query}"
            
            return self.create_success_response(
                request.id,
                data={"query": query, "url": search_url, "tab_id": tab_id},
                message=f"Google search for '{query}' initiated"
            )
            
        except Exception as e:
            logger.error(f"Error with Google search: {str(e)}")
            return self.create_error_response(request.id, f"Google search failed: {str(e)}")
    
    async def handle_wait(self, request: ActionRequest) -> Dict[str, Any]:
        """Handle wait/delay request"""
        try:
            duration = request.params.get("duration", 1.0)
            duration = float(duration)
            
            # Cap wait time to prevent abuse
            duration = min(duration, 10.0)
            
            await asyncio.sleep(duration)
            
            return self.create_success_response(
                request.id,
                data={"duration": duration},
                message=f"Waited for {duration} seconds"
            )
            
        except Exception as e:
            logger.error(f"Error with wait: {str(e)}")
            return self.create_error_response(request.id, f"Wait failed: {str(e)}")
    
    async def broadcast_to_clients(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        if self.clients:
            await asyncio.gather(
                *[client.send(json.dumps(message)) for client in self.clients],
                return_exceptions=True
            )
    
    async def handle_client(self, websocket, path):
        """Handle individual client connection"""
        client_id = await self.register_client(websocket)
        
        try:
            # Send welcome message
            welcome_message = {
                "type": "welcome",
                "client_id": client_id,
                "server_info": {
                    "version": "1.0.0",
                    "capabilities": [
                        "tab_management",
                        "navigation", 
                        "element_interaction",
                        "dom_extraction",
                        "screenshot_capture",
                        "keyboard_input"
                    ]
                },
                "timestamp": time.time()
            }
            await websocket.send(json.dumps(welcome_message))
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    response = await self.handle_message(websocket, message, client_id)
                    await websocket.send(json.dumps(response))
                    
                    # Log successful action
                    if response.get("result", {}).get("success"):
                        action = json.loads(message).get("action", "unknown")
                        logger.info(f"Action {action} completed successfully for client {client_id}")
                    
                except json.JSONDecodeError:
                    error_response = self.create_error_response("unknown", "Invalid JSON message")
                    await websocket.send(json.dumps(error_response))
                except Exception as e:
                    logger.error(f"Error processing message from {client_id}: {str(e)}")
                    error_response = self.create_error_response("unknown", f"Processing error: {str(e)}")
                    await websocket.send(json.dumps(error_response))
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} connection closed normally")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {str(e)}")
        finally:
            await self.unregister_client(websocket)
    
    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"Starting Dex MCP server on {self.host}:{self.port}")
        
        try:
            server = await websockets.serve(
                self.handle_client,
                self.host, 
                self.port,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10,
                max_size=10**7,  # 10MB max message size
                compression=None  # Disable compression for better performance
            )
            
            logger.info(f"✅ Dex MCP server successfully running on ws://{self.host}:{self.port}")
            logger.info("🔌 Ready to accept browser extension connections")
            logger.info("📱 Supported actions: get_tabs, screenshot, new_tab, navigate, click_element, input_text, grab_dom, capture_with_highlights")
            
            await server.wait_closed()
            
        except OSError as e:
            if e.errno == 48:  # Address already in use
                logger.error(f"❌ Port {self.port} is already in use. Please stop other services or use a different port.")
            else:
                logger.error(f"❌ Failed to start server: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"❌ Server error: {str(e)}")
            raise

async def main():
    """Main entry point"""
    server = DexMCPServer()
    
    try:
        await server.start_server()
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user (Ctrl+C)")
    except Exception as e:
        logger.error(f"💥 Server failed to start: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())