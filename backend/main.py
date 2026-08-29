from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import shutil
from dotenv import load_dotenv
from ai_service import extract_text_from_pdf, generate_knowledge_graph, feynman_tutor_chat

load_dotenv()

app = FastAPI(title="Synapse Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Synapse Backend is running! 🚀"}

@app.post("/api/generate-graph")
async def create_graph(file: UploadFile = File(...), level: str = Form("High School")):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        print(f"Extracting text from {file.filename} (Level: {level})...")
        text_content = extract_text_from_pdf(file_path)
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")
        print("Sending to AI for graph generation...")
        graph_data = generate_knowledge_graph(text_content, level)
        return {"status": "success", "filename": file.filename, "level": level, "graph": graph_data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

class FeynmanRequest(BaseModel):
    concept_a: str
    concept_b: str
    relationship: str
    chat_history: list
    user_message: str
    level: str = "High School"

@app.post("/api/feynman-chat")
async def feynman_chat(request: FeynmanRequest):
    try:
        ai_response = feynman_tutor_chat(
            concept_a=request.concept_a,
            concept_b=request.concept_b,
            relationship=request.relationship,
            chat_history=request.chat_history,
            user_message=request.user_message,
            level=request.level
        )
        return {"status": "success", "reply": ai_response}
    except Exception as e:
        print(f"Feynman Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))