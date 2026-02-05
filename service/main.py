from fastapi import FastAPI, File, UploadFile
from typing import List
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
@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/status")
async def status():
    try:
        response = (
            supabase.table("files")
            .select("file_type, status")
            .execute()
        )
        return response
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
    if not session_id:
        return "Error inserting to the sessions table"

    return {
        "files" : results,
        "ready": True,
        "session_id": session_id.data[0]["session_id"]
    }
    
    


@app.post("/chat")
async def chat(query: str, file_ids: List[int], session_id: str):
    relevant_text = retrieve_relevant_chunks(query, file_ids)

    if relevant_text:
        response = consultation_chatbot(query, relevant_text, session_id)
        return {"response": response}
    else:
        return{"response": "No relevant information found"}