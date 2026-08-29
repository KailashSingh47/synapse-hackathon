# backend/ai_service.py
import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

# Configure Google Gemini
   # Replace the text inside the quotes with your actual Google API key
  genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash-latest') # Flash is fast and free-ish

SYSTEM_PROMPT = """You are an expert educational AI. Your task is to analyze the provided educational text and extract a Knowledge Graph.
Identify core concepts (nodes) and relationships (edges).

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no explanations.
2. Limit to maximum 12 nodes.
3. Schema:
{
  "nodes": [{"id": "1", "label": "Concept", "description": "Short definition"}],
  "edges": [{"source": "1", "target": "2", "label": "relationship"}]
}
"""

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for i in range(min(10, len(reader.pages))):
            text += reader.pages[i].extract_text()
    return text[:6000]

def generate_knowledge_graph(text_content: str) -> dict:
    # Combine prompt and text
    full_prompt = f"{SYSTEM_PROMPT}\n\nText to analyze:\n{text_content}"
    
    # Call Gemini
    response = model.generate_content(full_prompt)
    ai_response = response.text
    
    # Clean up markdown formatting if Gemini adds it
    ai_response = re.sub(r'^```json\n|```$', '', ai_response.strip(), flags=re.MULTILINE)
    ai_response = re.sub(r'^```\n|```$', '', ai_response.strip(), flags=re.MULTILINE)

    try:
        return json.loads(ai_response)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Raw response: {ai_response}")
        # Return a dummy graph if it fails so the frontend doesn't crash
        return {
            "nodes": [{"id": "1", "label": "Error", "description": "AI failed to parse. Try again."}],
            "edges": []
        }