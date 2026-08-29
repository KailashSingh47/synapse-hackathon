import os
import json
import re
from google import genai
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

MODEL_NAME = "gemini-3.6-flash"

def get_graph_prompt(level: str) -> str:
    return f"""You are an expert educational AI. Analyze the text and extract a Knowledge Graph.
The audience is at a {level} education level. Tailor vocabulary to match.

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no ```json tags.
2. Maximum 12 nodes.
3. Schema:
{{
  "nodes": [{{"id": "1", "label": "Concept", "description": "Short definition"}}],
  "edges": [{{"source": "1", "target": "2", "label": "relationship"}}]
}}
"""

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for i in range(min(10, len(reader.pages))):
            text += reader.pages[i].extract_text()
    return text[:6000]

def generate_knowledge_graph(text_content: str, level: str = "High School") -> dict:
    full_prompt = f"{get_graph_prompt(level)}\n\nText to analyze:\n{text_content}"
    response = client.models.generate_content(model=MODEL_NAME, contents=full_prompt)
    ai_response = response.text
    ai_response = re.sub(r'^```json\n|```$', '', ai_response.strip(), flags=re.MULTILINE)
    ai_response = re.sub(r'^```\n|```$', '', ai_response.strip(), flags=re.MULTILINE)
    try:
        return json.loads(ai_response)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        return {"nodes": [{"id": "1", "label": "Error", "description": "AI failed to parse."}], "edges": []}

def feynman_tutor_chat(concept_a: str, concept_b: str, relationship: str, chat_history: list, user_message: str, level: str = "High School") -> str:
    system_prompt = f"""You are 'Feynman', an expert Socratic tutor.
The student is at a {level} education level. Match your vocabulary and analogies to it.
Concept A: {concept_a}
Concept B: {concept_b}
Relationship: {relationship}

RULES:
1. NEVER give the direct answer.
2. Correct answer: praise briefly, ask a deeper question.
3. Wrong answer: point out the flaw, ask a guiding hint question.
4. Under 3 sentences. ALWAYS end with a question.
"""
    history_context = "\n".join([f"{m['role']}: {m['content']}" for m in chat_history]) or "(none)"
    full_prompt = f"{system_prompt}\n\nPrevious conversation:\n{history_context}\n\nStudent's latest message: {user_message}\n\nYour response as Feynman:"
    response = client.models.generate_content(model=MODEL_NAME, contents=full_prompt)
    return response.text.strip()