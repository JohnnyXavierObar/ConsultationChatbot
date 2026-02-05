from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from typing import List, Optional
from process import *
from fastapi.middleware.cors import CORSMiddleware

# Allow requests from localhost:3000 (your Next.js frontend)
origins = [
    "http://localhost:3000",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # <- frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    file_ids: List[int]
    session_id: str

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/status")
async def status(file_ids: Optional[List[int]] = Query(default=None)):
    try:
        query = supabase.table("files").select("file_type, status")

        if file_ids:
            query = query.in_("id", file_ids)

        response = query.execute()
        return response.data

    except Exception as e:
        return {"error": str(e)}

@app.post("/ingest")
async def ingest(files:List[UploadFile] = File(...)):
    results = []
    file_ids = []
    ready = True
    for file in files:
        try:
            file_bytes = await file.read()

            file_id = create_file_record(
                file_name=file.filename,
                file_type = file.content_type
            )

            if file.content_type == "application/pdf":
                chunks = chunk_pdf(file_bytes, file.filename)
            elif file.content_type == "text/plain":
                chunks = chunk_text(file_bytes, file.filename)
            else:
                return{"error": "not pdf/txt file"}
        
            embed_and_store(chunks, file_id)

            supabase.table("files").update(
                {"status": "processed"}
            ).eq("file_id", file_id).execute()

            file_ids.append(file_id)

            results.append({
                "file_name": file.filename,
                "file_id": file_id,
                "chunks": len(chunks)
            })

        except Exception as e:
            file_ids.append(file_id)
            results.append({
                "file_name": file.filename,
                "error": str(e)
            })
  
    if not results:
        return[]
    
    session_id = (
        supabase.table("sessions")
        .insert({"file_ids":file_ids})
        .execute()
    )
    if not session_id.data:
        return {"error": "Failed to create session"}

    return {
        "files" : results,
        "ready": True,
        "session_id": session_id.data[0]["session_id"]
    }
    
    


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        relevant_text = retrieve_relevant_chunks(request.query, request.file_ids)
        response = consultation_chatbot(request.query, relevant_text, request.session_id)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except KeyError as ke:
        raise HTTPException(status_code=422, detail=f"Missing key: {ke}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")