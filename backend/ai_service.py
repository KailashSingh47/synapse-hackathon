import os
import json
import re
from google import genai
from dotenv import load_dotenv
import PyPDF2

load_dotenv()

client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

# The model that works with your key
MODEL_NAME = "gemini-3.6-flash"

def get_graph_prompt(level: str) -> str:
    return f"""You are an expert educational AI. Your task is to analyze the provided educational text and extract a Knowledge Graph.
Identify core concepts (nodes) and relationships (edges).
The target audience is at a {level} education level. Tailor the complexity and vocabulary of the node descriptions to match this level perfectly.

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no explanations, no ```json tags.
2. Limit to maximum 12 nodes.
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
    system_prompt = get_graph_prompt(level)
    full_prompt = f"{system_prompt}\n\nText to analyze:\n{text_content}"
    
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=full_prompt
    )
    ai_response = response.text
    
    ai_response = re.sub(r'^```json\n|```$', '', ai_response.strip(), flags=re.MULTILINE)
    ai_response = re.sub(r'^```\n|```$', '', ai_response.strip(), flags=re.MULTILINE)

    try:
        return json.loads(ai_response)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Raw response: {ai_response}")
        return {
            "nodes": [{"id": "1", "label": "Error", "description": "AI failed to parse."}],
            "edges": []
        }

# --- SAGE MODE (Socratic Tutor) ---
def feynman_tutor_chat(concept_a: str, concept_b: str, relationship: str, chat_history: list, user_message: str, level: str = "High School") -> str:
    system_prompt = f"""You are 'Sage', an expert Socratic tutor and learning guide.
The student is at a {level} education level. Tailor your vocabulary, tone, and analogies to match this level perfectly.
The student is trying to understand the relationship between two concepts:
Concept A: {concept_a}
Concept B: {concept_b}
Relationship: {relationship}

CRITICAL RULES:
1. NEVER give the student the direct answer or explain the concept for them.
2. If their answer is correct, praise them briefly and ask a deeper follow-up question.
3. If their answer is wrong or incomplete, point out the flaw and ask a guiding hint question.
4. Keep responses under 3 sentences. ALWAYS end with a question.
"""

    history_context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    if not history_context:
        history_context = "(No previous conversation)"

    full_prompt = f"""{system_prompt}

Previous conversation:
{history_context}

Student's latest message: {user_message}

Your response as Sage:"""

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=full_prompt
    )
    return response.text.strip()