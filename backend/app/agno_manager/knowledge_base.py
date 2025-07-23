from agno.knowledge.text import TextKnowledgeBase

from agno.vectordb.pgvector import PgVector, SearchType
from agno.document.base import Document
# from agno_manager.knowledge_data.text_documents import content_data
from uuid import uuid4
from agno.knowledge.document import DocumentKnowledgeBase
from agno.embedder.google import GeminiEmbedder
from . import text_documents
from agno.reranker.cohere import CohereReranker
import os
from dotenv import load_dotenv

load_dotenv()





content_data = text_documents.content_data

API_KEY = 'AIzaSyBdtXQxu979vhRtsE5GgGQYCUJLjVBYLEk'



# knowledge_base = TextKnowledgeBase(
#     path="data/txt",
#     # Table name: ai.text_documents
#     vector_db=PgVector(
#         table_name="text_documents",
#         db_url="postgresql+psycopg://ai:ai@localhost:5532/ai",
#     ),
# )

documents = [Document(id=str(uuid4()), content=content_data)]

# Database connection URL
db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://ai:ai@localhost:5532/ai")

# Create a knowledge base with the loaded documents
knowledge_base = DocumentKnowledgeBase(
    documents=documents,
    vector_db=PgVector(
        table_name="documents",
        db_url=db_url,
        search_type=SearchType.hybrid,
        embedder=GeminiEmbedder(id="text-embedding-004", dimensions=768, api_key=API_KEY),
        reranker=CohereReranker(model="rerank-v3.5"),
    ),
    
)
