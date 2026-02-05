# Deliverables Checklist — Consultation Mode Chatbot (Sprint 1)

| Deliverable | Description | Status | Notes / Links |
|------------|-------------|--------|---------------|
| **D0** | README_local_setup.md — Run app + service + env vars | ✅ Complete | [`README.md`](../README.md) |
| **D1** | interface_contract.md — endpoints, payloads, errors, citation format, readiness rules | ✅ Complete | [`docs/interface_contract.md`](./interface_contract.md) |
| **D2** | data_model.md — tables: files, chunks, embeddings, jobs/status; required fields and indexes | ✅ Complete | [`docs/data_model.md`](./data_model.md) |
| **D3** | upload_policy.md — max 10 files, 5MB each; accepted types; error messages/UI states | ✅ Complete | [`docs/upload_policy.md`](./upload_policy.md) |
| **D4** | Upload UI/component — multi-file selection, size limits, error states | ✅ Complete | [`frontend/components/UploadUI.tsx`](../frontend/components/UploadUI.tsx) |
| **D5** | Storage objects created for each file, linked to stable file_id | ✅ Complete | Supabase Storage verified |
| **D6** | DB rows created for each file — file_id, filename, size, type, timestamp, status | ✅ Complete | Supabase Postgres verified |
| **D7** | Batch ingestion request initiated with list of file_ids (or batch_id) | ✅ Complete | `/ingest` endpoint working |
| **D8** | `/ingest` endpoint — accepts file_ids/batch_id, tracks ingestion per file | ✅ Complete | [`service/routes/ingest.py`](../service/routes/ingest.py) |
| **D9** | Extraction: `.txt` and `.pdf` end-to-end | ✅ Complete | Basic PDF parsing implemented |
| **D10** | Chunking: store chunks with file_id, chunk_index, chunk_text, page_map/offsets | ✅ Complete | Stored in `embeddings` table |
| **D11** | Embeddings: generated per chunk, stored and queryable | ✅ Complete | OpenAI embeddings via API |
| **D12** | `/status` endpoint — batch + per-file status, error reasons if failed | ✅ Complete | [`service/routes/status.py`](../service/routes/status.py) |
| **D13** | “Ready” gating rules — all files ready + chunks/embeddings retrievable | ✅ Complete | Verified in UI |
| **D14** | `/chat` endpoint — user message + batch/file scope → response + citations | ⚠️ Incomplete | Backend implemented, frontend integration pending |
| **D15** | Semantic retrieval — top-k chunk fetch by vector similarity, multi-file scope | ✅ Complete | Tested via API |
| **D16** | Citation enforcement rules — always include citations, “not enough info” if insufficient | ⚠️ Partially Complete | Backend enforces citations; frontend display needs testing with integrated chat |
| **D17** | UI citation rendering — display file/chunk/page reference, “view source” snippet | ✅ Complete | [`frontend/components/ChatMessage.tsx`](../frontend/components/ChatMessage.tsx) |
| **D18** | workflow_diagram.pdf/png — shows Next.js ↔ Supabase ↔ FastAPI ↔ OpenAI, ingestion + retrieval + citation mapping | ✅ Complete | [`docs/workflow_diagram.pdf`](./workflow_diagram.pdf) |
| **D19** | technical_brief.md — scope, design decisions, interface contract, data model, limitations | ✅ Complete | [`docs/technical_brief.md`](./technical_brief.md) |
| **D20** | demo_script.md — 3–5 minute demo | ✅ Complete | [`docs/demo_script.md`](./demo_script.md) |
| **D21** | runbook.md — run locally in <15 mins checklist | ✅ Complete | [`docs/runbook.md`](./runbook.md) |
| **D22** | deliverables_checklist.md — this checklist | ✅ Complete | [`docs/deliverables_checklist.md`](./deliverables_checklist.md) |

---

**Summary of Pending Work:**

- **Frontend ↔ `/chat` endpoint integration**: Chat UI needs to call the backend `/chat` endpoint with selected files/batch scope and session ID.  
- **Citation display testing in frontend**: Verify every assistant response shows citations correctly.  
- **"Insufficient evidence" scenario**: Needs testing in integrated UI.

---

**Next Steps to Close Sprint 1:**

1. Wire frontend chat input to `/chat` endpoint.  
2. Ensure responses always render citations in the UI.  
3. Test edge cases where retrieved chunks are insufficient and the assistant responds "not enough information."  
