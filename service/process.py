from io import BytesIO
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_openai import OpenAIEmbeddings
from supabase.client import Client, create_client
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from pypdf import PdfReader

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_SERVICE_KEY")
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")

if not supabase_key:
   raise ValueError("Supabase key not found. Please set NEXT_PUBLIC_SUPABASE_SERVICE_KEY.")
if not supabase_url:
    raise ValueError("Supabase URL not found. Please set NEXT_PUBLIC_SUPABASE_URL.")
supabase: Client = create_client(supabase_url, supabase_key)
embeddings = OpenAIEmbeddings(
    model = "text-embedding-3-small"
)


text_splitter = RecursiveCharacterTextSplitter(
    separators=["\n\n", "\n", " ", ""],
    chunk_size=600,
    chunk_overlap=100,
    length_function=len,
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

vector_store = SupabaseVectorStore(
    embedding=embeddings,
    client=supabase,
    table_name="embeddings",
)

query = "A bleak British seaside town seen through the eyes of a cynical teenager"
matched_docs = vector_store.similarity_search(query, k=2)
for i, doc in enumerate(matched_docs, 1):
    print(f"--- Result {i} ---")
    print("Content:", doc.page_content)
    print("Metadata:", doc.metadata)

