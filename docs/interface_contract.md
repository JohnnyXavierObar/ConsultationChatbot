# Consultation Mode Chatbot — Interface Contract

This document describes the API interface for the Consultation Mode Chatbot backend based on the current FastAPI implementation.

---

## Base URL

http://127.0.0.1:8000/

---

## Endpoints

### 1. POST /ingest

Purpose: Upload one or more `.pdf` or `.txt` files, process them (chunk + embed), and create a session.

Request (multipart/form-data):

Field  | Type    | Required | Description
------ | ------- | -------- | -----------
files  | file[]  | Yes      | List of `.pdf` or `.txt` files

Response (JSON):
```json
{
  "files": [
    {
      "file_name": "string",
      "file_id": 123,
      "chunks": 10,
      "status": "processed"
    },
    {
      "file_name": "string",
      "file_id": 124,
      "error": "string",
      "status": "failed"
    }
  ],
  "ready": true,
  "session_id": "string"
}
```
Notes:

- ready is true only if all files processed successfully.
- chunks is the number of chunks extracted from that file.
- status is "processed" if successful, "failed" otherwise.
- session_id corresponds to a row in sessions table containing the uploaded file_ids.

Errors:

{
  "error": {
    "code": "SESSION_CREATE_FAILED",
    "message": "Failed to create session"
  }
}

---

### 2. GET /status

Purpose: Get ingestion status for one or more files.

Query Parameters:

Parameter | Type   | Required | Description
--------- | ------ | -------- | -----------
file_ids  | int[]  | No       | Optional list of file IDs to check

Response (JSON):

{
  "ready": true,
  "file_status": [
    {
      "file_id": 123,
      "file_name": "example.pdf",
      "status": "processed"
    },
    {
      "file_id": 124,
      "file_name": "bad.txt",
      "status": "failed"
    }
  ]
}

Notes:

- ready is true only if all returned files are "processed".
- If no files exist, ready is false.

Errors:

{
  "error": {
    "code": "STATUS_ERROR",
    "message": "description"
  }
}

---

### 3. POST /chat

Purpose: Query the chatbot based on previously uploaded files.

Request (JSON):

{
  "query": "string",
  "session_id": "string",
  "file_ids": [123, 124],   // optional, default: all files in session
  "top_k": 5                 // optional, default 5
}

Response (JSON):

{
  "response": "string",
  "citations": [
    {
      "file_id": 123,
      "file_name": "example.pdf",
      "page_number": 2,
      "content": "chunk content here"
    }
  ],
  "info": {
    "retrieved_chunks": 3,
    "status": "success"       // "insufficient_info" if no chunks found
  }
}

Notes:

- citations correspond to chunks retrieved and used to generate the answer.
- If no relevant chunks are found, response is "No relevant information found" and status is "insufficient_info".

Errors: None explicitly in code; exceptions return HTTP 500.

---

## Data Models

File Record:

{
  "file_id": int,
  "file_name": "string",
  "file_type": "string",
  "status": "processing" | "processed" | "failed"
}

Session Record:

{
  "session_id": "string",
  "file_ids": [int]
}

Chat Citation:

{
  "file_id": int,
  "file_name": "string",
  "page_number": int,
  "content": "string"
}

---

## Readiness Rules

- Chat (/chat) should only be used after /ingest returns "ready": true.
- /status provides file-level readiness; "ready": true only if all returned files are processed.

---

## Constraints / Limits

- Max files per /ingest request: Not enforced in backend.
- Max file size: Not enforced in backend.
- File types: Only .pdf or .txt (application/pdf or text/plain MIME types).
- Chat context is limited by top_k retrieved chunks and agent configuration.

---

## Notes

- All endpoints return JSON.
- Citation format is directly renderable in frontend.
- Session management is required to maintain multi-file chat context.
