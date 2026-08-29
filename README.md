<div align="center">

# 🧠 Synapse AI

**Transform passive reading into active learning with AI-powered Knowledge Graphs**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)]()
[![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?logo=google&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]()

*Built for the Prometheus August AI Challenge*

</div>

---

## 🎯 The Problem

Students read hundreds of pages — but passive reading has a brutal truth: **most of it is forgotten within days**. Highlighting and re-reading *feel* productive, but they don't build durable understanding or reveal how concepts connect.

## ✨ The Solution

**Synapse AI** turns any educational PDF into an **interactive Knowledge Graph**, then pairs it with **Sage Mode** 🌿 — a Socratic AI tutor that tests your understanding instead of handing you the answer.

📄 Upload a PDF → 🕸️ Get a living concept map → 🌿 Get quizzed by Sage

## 🚀 Key Features

| Feature | Description |
|---|---|
| 📄 **PDF → Knowledge Graph** | AI extracts core concepts (nodes) and relationships (edges) from any text-based PDF |
| 🕸️ **Interactive Visualization** | Drag, zoom, and explore concepts with ReactFlow |
| 🌿 **Sage Mode** | A Socratic tutor that asks guiding questions and *never* gives away the answer |
| 🎚️ **Adaptive Difficulty** | From "Explain Like I'm 5" to "Expert" — the AI adapts its vocabulary and analogies |
| 🌙 **Dark Mode** | Polished, SaaS-grade UI with smooth animations |

## 🏗️ Architecture

```
┌─────────────┐  PDF + level  ┌──────────────┐  extract text  ┌─────────┐
│  Frontend   │ ────────────► │   FastAPI    │ ─────────────► │ PyPDF2  │
│  Next.js +  │               │   Backend    │                └─────────┘
│  ReactFlow  │ ◄──────────── │  (port 8000) │  send prompt   ┌─────────┐
│ (port 3000) │   JSON graph  │              │ ─────────────► │ Gemini  │
└─────────────┘               └──────────────┘                └─────────┘
```

## ⚡ Quick Start

**Prerequisites:** Python 3.10+, Node.js 18+, and a free Google Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 1️⃣ Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows (source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
echo "GOOGLE_API_KEY=your_key_here" > .env
uvicorn main:app --reload    # → http://localhost:8000
```

### 2️⃣ Frontend
```bash
cd frontend
npm install
npm run dev                  # → http://localhost:3000
```

## 📡 API Reference

### `POST /api/generate-graph`
Form data: `file` (PDF), `level` (e.g. "High School")
```json
{
  "status": "success",
  "graph": {
    "nodes": [{ "id": "1", "label": "Photosynthesis", "description": "..." }],
    "edges": [{ "source": "1", "target": "2", "label": "uses" }]
  }
}
```

### `POST /api/feynman-chat` (Sage Mode 🌿)
```json
{
  "concept_a": "Photosynthesis",
  "concept_b": "Sunlight",
  "relationship": "uses",
  "chat_history": [],
  "user_message": "Plants eat sunlight!",
  "level": "High School"
}
```

## 🎓 The Learning Science

- **Active Recall** — retrieving knowledge strengthens memory far more than re-reading.
- **The Feynman Technique** — explaining in your own words exposes gaps in understanding.
- **Dual Coding** — visuals (graphs) + language = double the memory encoding.
- **Adaptive Learning** — the same content, tuned to the learner's level.

## 🗺️ Roadmap

- [ ] Multi-modal input (YouTube URLs, whiteboard photos)
- [ ] Anki / flashcard export
- [ ] Saved graphs with Supabase
- [ ] Voice mode for Sage

## 👥 Team

Built with ❤️ for the **Prometheus August AI Challenge**

## 📄 License

MIT