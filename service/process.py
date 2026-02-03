from io import BytesIO
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings, OpenAI, ChatOpenAI
from supabase.client import Client, create_client
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from pypdf import PdfReader
from typing import List
from pydantic import BaseModel, Field
from langchain.agents import create_agent
from langchain.messages import SystemMessage,AIMessage, HumanMessage



load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")

if not supabase_key:
   raise ValueError("Supabase key not found. Please set NEXT_PUBLIC_SUPABASE_SERVICE_KEY.")
if not supabase_url:
    raise ValueError("Supabase URL not found. Please set NEXT_PUBLIC_SUPABASE_URL.")
supabase: Client = create_client(supabase_url, supabase_key)

model = ChatOpenAI(model="gpt-5-mini", api_key=openai_api_key)

embeddings = OpenAIEmbeddings(
    model = "text-embedding-3-small"
)

text_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=600,
    chunk_overlap=100,
    length_function=len,
)

    
agent = create_agent(
    model=model,
)

def create_file_record(file_name, file_type):
    res = (
        supabase
        .table("files")
        .insert({
            "file_name": file_name,
            "file_type": file_type,
            "status": "processing",
        })
        .execute()
    )

    return res.data[0]["file_id"]

#if text file
def chunk_text(file_bytes, file_name):
    text = file_bytes.decode("utf-8")
    chunks_with_meta = []

    lines_per_page = 50
    lines = text.split("\n")
    for pseudo_page_number, start in enumerate(range(0, len(lines), lines_per_page), start=1):
        page_text = "\n".join(lines[start:start+lines_per_page])
        for chunk in text_splitter.split_text(page_text):
            chunks_with_meta.append({
                "chunk_content": chunk,
                "page_number": pseudo_page_number,
                "source_file": file_name
            })

    return chunks_with_meta


def chunk_pdf(file, file_name):
    reader = (PdfReader(BytesIO(file)))
    num_of_pages = len(reader.pages)
    # filename = file.filename.lower()
    # print(reader.pages[0])
    chunks_with_meta = []

    for page_number, page in enumerate(reader.pages, start = 1):
        page_text = page.extract_text() or ""
        for chunk in text_splitter.split_text(page_text):
            chunks_with_meta.append({
                "chunk_content": chunk,
                "page_number": page_number,
                "source_file": file_name
            })
    
    return chunks_with_meta

def embed_and_store(chunks, file_id: int):
    SupabaseVectorStore.from_texts(
        texts=[c["chunk_content"] for c in chunks],
        embedding=embeddings,
        client=supabase,
        table_name="embeddings",
        metadatas=[
            {
                "file_id": file_id,
                "page_number": c["page_number"],
            }
            for c in chunks
        ],
    )


def retrieve_relevant_chunks(query,file_ids):

    match_count = 10

    vectored_query = embeddings.embed_query(query)
    result = []
    response = supabase.rpc(
    "hybrid_search",
    {
        "query_text": query,
        "query_embedding": vectored_query,
        "match_count": match_count,
        "file_ids": file_ids,
    }
    ).execute()

    if not response.data:
        return []
    
    result = [
        {
            "content": row["content"],
            "file_id": row["metadata"]["file_id"],
            "page_number": row["metadata"]["page_number"]
        }
        for row in response.data
    ]

    unique_file_ids = {
        row["metadata"]["file_id"]
        for row in response.data
    }

    files_response = (
        supabase
        .table("files")
        .select("file_id, file_name")
        .in_("file_id", list(unique_file_ids))
        .execute()
    )

    file_map = {
        row["file_id"]: row["file_name"]
        for row in files_response.data
    }

    for chunk in result:
        chunk["file_name"] = file_map.get(chunk["file_id"])

    return result

def consultation_chatbot(query, retrieved_chunks, session_id):
    memory = (
        supabase.table("messages")
        .select("user_query,ai_message")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .execute()
    )
    message_history = ""
  
    
    if memory.data:
        for idx, message in enumerate(memory.data):
            message_history = f"{idx+1}:\n User Query: {message["user_query"]}\n AI Reply: {message["ai_message"]}"

    role = "Act as a professional consultation chatbot with expertise in providing clear, practical advice across multiple domains, including lifestyle, productivity, mental health, and professional development. Your tone should be friendly, empathetic, and approachable. Users will ask questions seeking guidance, solutions, or insights. Assume the user has minimal prior knowledge unless they specify otherwise. Your goal is to provide actionable, accurate, and easy-to-understand responses that help the user make informed decisions."
    numbered = [f"{idx+1}: {chunk["content"]} " for idx, chunk in enumerate(retrieved_chunks)]
    relevant_text = "\n".join(numbered)
    context = f"""Role/Persona: {role}\nContext: {relevant_text}\n 
    Past Message History: {message_history if message_history else "None"}
    \nYour output should be concise and up to 5-7 sentences

    If the number of context is lower than 5, start with "Apologies, there’s not enough information available, but based on what I can see..."

    **Constraints**:
    - Avoid technical jargon; explain terms simply.
    - Remain neutral and unbiased.
    - Always provide practical, actionable advice rather than just theoretical explanations.
    
    **User Input/Question**:{query}
    """

    response = agent.invoke(
         {"messages": context}
    )
    ai_response = response["messages"][1].content

    store_message = (
        supabase.table("messages")
        .insert({
            "user_query": query,
            "ai_message": ai_response,
            "session_id": session_id
        }).execute()
    )
    if not store_message.data:
        return "There was an error storing data"
    
    structured_output = {
        "ai_response": ai_response,
        "references": retrieved_chunks,
    }
    
    return structured_output

