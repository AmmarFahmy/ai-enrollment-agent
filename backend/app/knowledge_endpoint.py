# backend/app/knowledge_endpoint.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging
from pathlib import Path
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Knowledge base file path
KB_FILE = Path("app/knowledge_data/knowledge_base.json")

# text_documents.py file path
TEXT_DOCUMENTS_FILE = Path("app/agno_manager/text_documents.py")

# Create the directory if it doesn't exist
KB_FILE.parent.mkdir(parents=True, exist_ok=True)

# Knowledge section model
class KnowledgeSection(BaseModel):
    id: str
    title: str
    content: str

class KnowledgeSectionCreate(BaseModel):
    title: str
    content: str

class KnowledgeSectionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

# Initialize the router
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

# Helper functions to load/save knowledge base
def load_knowledge_base() -> List[KnowledgeSection]:
    """Load the knowledge base from file"""
    if not KB_FILE.exists():
        # Create default knowledge base if file doesn't exist
        default_kb = [
            {
                "id": "kb-1",
                "title": "Application Status",
                "content": "We have received all of your documents. Your application is under [Pending Initial review/Pending Document Verification]."
            },
            {
                "id": "kb-2",
                "title": "Deposit Refund Policy",
                "content": "The deposit is a non-refundable payment unless you were denied your visa. If you were denied your visa you may share the 221G slip and request a refund. For further details, please contact Mr. Neal E Jeffery - njeffery@iit.edu / 312-567-5053."
            },
            {
                "id": "kb-3",
                "title": "TOEFL/IELTS Requirement",
                "content": "All international students are required to submit TOEFL/IELTS test scores. If you have a 2-year degree from the United States or if you are from a TOEFL/IELTS waiver-eligible country, then we may waive this requirement. For more information: https://www.iit.edu/admissions-aid/graduate-admission/international-students/application-requirements-and-checklist"
            }
        ]
        save_knowledge_base(default_kb)
        return [KnowledgeSection(**item) for item in default_kb]
    
    try:
        with open(KB_FILE, "r") as f:
            data = json.load(f)
        return [KnowledgeSection(**item) for item in data]
    except Exception as e:
        logger.error(f"Error loading knowledge base: {str(e)}")
        return []

def save_knowledge_base(knowledge_base: List[dict]) -> bool:
    """Save the knowledge base to file"""
    try:
        with open(KB_FILE, "w") as f:
            json.dump(knowledge_base, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving knowledge base: {str(e)}")
        return False

def sync_with_text_documents():
    """Sync the knowledge base with text_documents.py"""
    try:
        # Read the current knowledge base
        knowledge_base = load_knowledge_base()
        
        # Read the text_documents.py file
        if not TEXT_DOCUMENTS_FILE.exists():
            logger.error("text_documents.py file not found")
            return False
        
        with open(TEXT_DOCUMENTS_FILE, "r") as f:
            text_documents_content = f.read()
        
        # Extract the content_data variable
        match = re.search(r'content_data\s*=\s*\'\'\'(.*?)\'\'\'', text_documents_content, re.DOTALL)
        if not match:
            logger.error("Could not find content_data in text_documents.py")
            return False
        
        existing_content = match.group(1)
        
        # Generate new content from knowledge base
        new_content = "# Illinois Institute of Technology Graduate Admissions Knowledge Base\n\n"
        new_content += "## Knowledge Base - Managed via Web UI\n\n"
        
        for section in knowledge_base:
            new_content += f"### {section.title}\n"
            new_content += f"{section.content}\n\n"
        
        # Add a marker to separate UI-managed content from original content
        new_content += "## Original Knowledge Base Content\n\n"
        
        # Add existing content, but remove the header if it exists
        cleaned_existing_content = re.sub(r'^# Illinois Institute of Technology Graduate Admissions Knowledge Base\s*', '', existing_content, flags=re.MULTILINE)
        new_content += cleaned_existing_content
        
        # Update the content_data variable in text_documents.py
        updated_content = text_documents_content.replace(match.group(0), f"content_data = '''{new_content}'''")
        
        # Write back to text_documents.py
        with open(TEXT_DOCUMENTS_FILE, "w") as f:
            f.write(updated_content)
        
        logger.info("Successfully synced knowledge base with text_documents.py")
        return True
    except Exception as e:
        logger.error(f"Error syncing with text_documents: {str(e)}")
        return False

# Routes
@router.get("/", response_model=List[KnowledgeSection])
async def get_knowledge_base():
    """Get all knowledge base sections"""
    return load_knowledge_base()

@router.post("/", response_model=KnowledgeSection)
async def create_knowledge_section(section: KnowledgeSectionCreate):
    """Create a new knowledge section"""
    knowledge_base = load_knowledge_base()
    
    # Generate a new ID
    new_id = f"kb-{len(knowledge_base) + 1}"
    
    # Create new section
    new_section = KnowledgeSection(
        id=new_id,
        title=section.title,
        content=section.content
    )
    
    # Add to knowledge base
    knowledge_base.append(new_section)
    
    # Save
    kb_dicts = [kb.dict() for kb in knowledge_base]
    if save_knowledge_base(kb_dicts):
        # Update text_documents.py
        sync_with_text_documents()
        return new_section
    else:
        raise HTTPException(status_code=500, detail="Failed to save knowledge base")

@router.put("/{section_id}", response_model=KnowledgeSection)
async def update_knowledge_section(section_id: str, updates: KnowledgeSectionUpdate):
    """Update a knowledge section"""
    knowledge_base = load_knowledge_base()
    
    # Find the section
    for i, section in enumerate(knowledge_base):
        if section.id == section_id:
            # Update the section
            if updates.title is not None:
                knowledge_base[i].title = updates.title
            if updates.content is not None:
                knowledge_base[i].content = updates.content
            
            # Save
            kb_dicts = [kb.dict() for kb in knowledge_base]
            if save_knowledge_base(kb_dicts):
                # Update text_documents.py
                sync_with_text_documents()
                return knowledge_base[i]
            else:
                raise HTTPException(status_code=500, detail="Failed to save knowledge base")
    
    # Section not found
    raise HTTPException(status_code=404, detail=f"Knowledge section with id {section_id} not found")

@router.delete("/{section_id}")
async def delete_knowledge_section(section_id: str):
    """Delete a knowledge section"""
    knowledge_base = load_knowledge_base()
    
    # Find the section
    for i, section in enumerate(knowledge_base):
        if section.id == section_id:
            # Remove the section
            del knowledge_base[i]
            
            # Save
            kb_dicts = [kb.dict() for kb in knowledge_base]
            if save_knowledge_base(kb_dicts):
                # Update text_documents.py
                sync_with_text_documents()
                return {"success": True}
            else:
                raise HTTPException(status_code=500, detail="Failed to save knowledge base")
    
    # Section not found
    raise HTTPException(status_code=404, detail=f"Knowledge section with id {section_id} not found")

@router.post("/sync")
async def sync_knowledge_base():
    """Sync the knowledge base with text_documents.py"""
    try:
        if sync_with_text_documents():
            return {"success": True}
        else:
            raise HTTPException(status_code=500, detail="Failed to sync knowledge base")
    except Exception as e:
        logger.error(f"Error syncing knowledge base: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error syncing knowledge base: {str(e)}")

# Initialize the knowledge base from text_documents.py if it doesn't exist
@router.post("/initialize-from-text-documents")
async def initialize_from_text_documents():
    """Initialize the knowledge base from text_documents.py"""
    try:
        # Read the text_documents.py file
        if not TEXT_DOCUMENTS_FILE.exists():
            raise HTTPException(status_code=404, detail="text_documents.py file not found")
        
        with open(TEXT_DOCUMENTS_FILE, "r") as f:
            text_documents_content = f.read()
        
        # Extract the content_data variable
        match = re.search(r'content_data\s*=\s*\'\'\'(.*?)\'\'\'', text_documents_content, re.DOTALL)
        if not match:
            raise HTTPException(status_code=500, detail="Could not find content_data in text_documents.py")
        
        existing_content = match.group(1)
        
        # Extract sections using headers
        sections = []
        current_section = None
        
        for line in existing_content.split('\n'):
            if line.startswith('### '):
                # New section
                if current_section:
                    sections.append(current_section)
                
                current_section = {
                    "id": f"kb-{len(sections) + 1}",
                    "title": line[4:].strip(),
                    "content": ""
                }
            elif current_section and line and not line.startswith('#'):
                # Content for current section
                current_section["content"] += line + "\n"
        
        # Add the last section
        if current_section:
            sections.append(current_section)
        
        # Save to knowledge base
        if save_knowledge_base(sections):
            return {"success": True, "sections": len(sections)}
        else:
            raise HTTPException(status_code=500, detail="Failed to save knowledge base")
    except Exception as e:
        logger.error(f"Error initializing from text_documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error initializing from text_documents: {str(e)}")