from fastapi import FastAPI, File, UploadFile
from typing import List
from process import *

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/ingest")
async def ingest(files:List[UploadFile] = File(...)):
    results = []
    for file in files:
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

        results.append({
            "file_name": file.filename,
            "file_id": file_id,
            "chunks": len(chunks)
        })
        
    return results


@app.post("/uploadfile")
async def create_upload_file(file:UploadFile):
    return{"filename": file.file}