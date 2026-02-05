# Consultation Mode Chatbot — Sprint 1

This repository contains a minimal Consultation Mode chatbot where users can upload documents and interact with an assistant whose responses are strictly grounded in the uploaded content.

## Repo Structure

```
/frontend       # Next.js frontend
/service        # FastAPI backend
/docs           # Documentation (workflow diagram, technical brief, deliverables checklist, etc.)
```

## Prerequisites

- Python 3.10+ (for FastAPI backend)
- Node.js 18+ (for Next.js frontend)
- Supabase project (Storage + Postgres)
- OpenAI API key

## Setup & Run Locally

### 1. Backend (FastAPI)

```bash
cd service
python -m venv venv
# Activate virtual environment:
# Linux/macOS
source venv/bin/activate
# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload
```

The FastAPI server will start at: `http://127.0.0.1:8000`

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at: `http://localhost:3000`

### 3. Environment Variables

Create `.env` files in both `service` and `frontend` as needed.

**service/.env**
```
OPENAI_API_KEY=<your_openai_api_key>
SUPABASE_URL=<your_supabase_url>
SUPABASE_KEY=<your_service_key>
```

**frontend/.env.local**
```
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
```

## Sprint 1 Project Status

- File upload: ✅ implemented
- Backend ingestion, chunking, embeddings: ✅ complete
- `/status` endpoint and "Ready" gating: ✅ complete
- `/chat` endpoint backend: ✅ implemented
- Frontend ↔ `/chat` integration: ❌ pending

## Documentation & Deliverables

Check the docs folder for detailed Sprint 1 deliverables:

- [`deliverables_checklist.md`](./docs/deliverables_checklist.md)
- [`technical_brief.md`](./docs/technical_brief.md)
- [`workflow_diagram.pdf`](./docs/workflow_diagram.pdf)

## Next Steps

- Complete frontend integration with `/chat` endpoint
- Test citation display and "insufficient evidence" handling
- Improve PDF extraction quality for complex layouts
