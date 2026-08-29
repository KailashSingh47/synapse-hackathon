# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from dotenv import load_dotenv
from ai_service import extract_text_from_pdf, generate_knowledge_graph

load_dotenv()

app = FastAPI(title="Synapse Backend API")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a temporary folder to store uploaded files
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Synapse Backend is running! 🚀"}

@app.post("/api/generate-graph")
async def create_graph(file: UploadFile = File(...)):
    # 1. Check if it's a PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    # 2. Save the uploaded file temporarily
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 3. Extract text from PDF
        print(f"Extracting text from {file.filename}...")
        text_content = extract_text_from_pdf(file_path)
        
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF. It might be an image-based PDF.")

        # 4. Generate the Knowledge Graph using AI
        print("Sending to AI for graph generation...")
        graph_data = generate_knowledge_graph(text_content)

        # 5. Return the JSON to the frontend
        return {
            "status": "success",
            "filename": file.filename,
            "graph": graph_data
        }

    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # 6. Clean up: Delete the temporary file
        if os.path.exists(file_path):
            os.remove(file_path)