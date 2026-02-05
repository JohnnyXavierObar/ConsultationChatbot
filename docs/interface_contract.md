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
```json
{
  "error": {
    "code": "SESSION_CREATE_FAILED",
    "message": "Failed to create session"
  }
}
```
---

### 2. GET /status

Purpose: Get ingestion status for one or more files.

Query Parameters:

Parameter | Type   | Required | Description
--------- | ------ | -------- | -----------
file_ids  | int[]  | No       | Optional list of file IDs to check

Response (JSON):
```json
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
```
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

Parameter | Type   | Required | Description
--------- | ------ | -------- | -----------
file_ids  | int[]  | Yes      | List of files for the chatbot to use
session_id| string | Yes      | For long-term conversations
query     | string | Yes      | User_query

Response (JSON):
```json
{
  "ai_response": "string",
  "references": [
    {
      "file_id": 123,
      "file_name": "example.pdf",
      "page_number": 2,
      "content": "chunk content here"
    }
  ],
}
```
Notes:

- citations correspond to chunks retrieved and used to generate the answer.
- If no relevant chunks are found, response is ""Apologies, there’s not enough information available, but based on what I can see..." and still generate an answer.

Errors: 
- 400 Bad Request: Raised if a ValueError occurs (e.g., invalid input values).
- 422 Unprocessable Entity: Raised if a KeyError occurs, typically due to missing keys in data.
- 500 Internal Server Error: Raised for unexpected server-side errors, such as database failures or AI service errors.
- Special case: If no relevant chunks are found, the endpoint still returns a valid AI response starting with "Apologies, there’s not enough information available, but based on what I can see..." instead of failing.

---

## Data Models

File Record:
```json
{
  "file_id": int,
  "file_name": "string",
  "file_type": "string",
  "status": "processing" | "processed" | "failed"
}
```
Session Record:
```json
{
  "session_id": "string",
  "file_ids": [int]
}
```
Chat Citation:
```json
{
  "file_id": int,
  "file_name": "string",
  "page_number": int,
  "content": "string"
}
```
---

## Readiness Rules

- Chat (/chat) should only be used after /ingest returns "ready": true.
- /status provides file-level readiness; "ready": true only if all returned files are processed.

---

## Constraints / Limits

- Max files per /ingest request: Not enforced in backend but enforced in frontend.
- Max file size: Not enforced in backend but enforced in frontend.
- File types: Only .pdf or .txt (application/pdf or text/plain MIME types).

---

## Notes

- All endpoints return JSON.
- Citation format is directly renderable in frontend.
- Session management is required to maintain multi-file chat context.
