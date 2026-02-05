# Technical Brief — Consultation Mode Chatbot (Sprint 1)

## 1. Scope and Objective

The objective of Sprint 1 is to deliver a minimal but functional Consultation Mode chatbot
that allows users to upload documents and interact with an assistant whose responses are
strictly grounded in the uploaded content.

Key goals:
- Upload up to 10 files (.pdf or .txt), 5MB max per file
- Persist files and metadata using Supabase Storage and Postgres
- Extract, chunk, and embed document content
- Gate chat availability on verified ingestion readiness
- Perform semantic retrieval over embeddings
- Enforce citations for every assistant response

---

## 2. High-Level Architecture

The system consists of two main components:

- **Frontend (Next.js)**
  - File upload UI and validation
  - Readiness gating
  - Chat interface and citation rendering

- **Backend Service (FastAPI)**
  - Ingestion, chunking, and embedding generation
  - Semantic retrieval over stored embeddings
  - Citation-enforced response generation

Shared infrastructure:
- Supabase Storage for raw file storage
- Supabase Postgres (with pgvector and tsvector) for metadata, chunks, and embeddings
- OpenAI APIs for embeddings and response generation

---

## 3. Ingestion and Readiness Workflow

1. User uploads files via the frontend UI.
2. Each file is validated (type, size, count) and sent to server in the `/ingest endpoint`.
4. The backend service processes each file:
   - Downloads the file 
   - Extracts text from `.txt` or `.pdf`
   - Chunks extracted text into manageable segments
   - Stores chunks with page or offset metadata
   - Generates embeddings for each chunk
5. File status transitions from `processing` → `processed` (or `failed`).
7. The frontend returns "ready: True", file_ids and session_id then enables chat only when:
   - All files are in the `ready` state
   - Chunks and embeddings are confirmed retrievable from the database

This gating prevents users from chatting against incomplete or missing data.

---

## 4. Semantic Retrieval and Chat Flow

When a user submits a chat message:

1. The frontend sends the user message ,selected file scope (batch_id or file_ids) and session_id to `/chat`.
2. The backend embeds the user query.
3. A vector similarity search retrieves the top-k most relevant chunks.
4. Retrieved chunks are passed as context to the response generator.
5. The assistant generates a response based on retrieved content.
6. Citations are attached to the response, mapping claims to stored chunks.

If retrieved evidence is insufficient, the assistant responds with an explicit
"not enough information" message while still citing retrieved content.

---

## 5. Citation Model

Each assistant response includes a citations array referencing stored chunks.

Minimum citation fields:
- file_id
- filename
- embedding_id
- chunk_content
- page_number

Citations ensure every response is traceable and auditable and can be rendered directly
in the UI with links or source previews.

---

## 6. Interface Contract Summary

The frontend and backend communicate via a defined API contract.

Core endpoints:
- `POST /ingest` — trigger ingestion for a batch or list of file_ids
- `GET /status` — return batch-level and per-file ingestion status
- `POST /chat` — generate citation-enforced responses

The contract specifies request/response schemas, error formats, citation structures,
and readiness signaling rules.

---

## 7. Data Model Summary

tables:
- `files` — file metadata and ingestion status
- `embeddings` — chunks, chunk_content, vector representations(pgvector & tsvector)
- `sessions` - serves as the session for every convo, enabling long term conversations
- `messages` - stored ai_reply and user_query for every session

Indexes include:
- Vector index on embedding columns
- Foreign key indexes on `file_id` and `chunk_id`

The schema prioritizes clarity, traceability, and ease of retrieval.

---

## 8. Design Decisions and Tradeoffs

Key design decisions:
- Strict readiness gating to avoid partial or misleading chat results
- Service-layer citation enforcement for correctness guarantees
- Simple, deterministic chunking strategy
- Batch-oriented ingestion triggering

Tradeoffs:
- No streaming ingestion or background job orchestration in Sprint 1
- Basic PDF text extraction

These tradeoffs were chosen to keep the system understandable and auditable.

---

## 9. Limitations and Next Steps

Current limitations:
- PDF extraction quality depends on source formatting
- No document updates or deletions
- No authentication or multi-user isolation
- No streaming responses

Potential next steps:
- Improved PDF parsing and layout-aware chunking
- Incremental and re-ingestion support
- Retrieval improvements (reranking, metadata filters)
