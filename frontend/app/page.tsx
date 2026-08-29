"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, { Controls, Background, MiniMap, applyNodeChanges, applyEdgeChanges } from "reactflow";
import "reactflow/dist/style.css";

const API_URL = "http://localhost:8000";
const LEVELS = ["Explain Like I'm 5", "Elementary", "High School", "College", "Expert"];

export default function Home() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState("High School");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [concepts, setConcepts] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback((c: any) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: any) => setEdges((e) => applyEdgeChanges(c, e)), []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // 1️⃣ CONNECT: Upload PDF to backend
  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("level", level);
    try {
      const res = await fetch(`${API_URL}/api/generate-graph`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Backend error! Is the server running on port 8000?");
      const data = await res.json();
      setNodes(data.graph.nodes.map((n: any, i: number) => ({
        id: String(n.id),
        data: { label: n.label },
        position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 200 },
      })));
      setEdges(data.graph.edges.map((ed: any, i: number) => ({
        id: `e${i}`, source: String(ed.source), target: String(ed.target),
        label: ed.label, animated: true, style: { stroke: "#3b82f6", strokeWidth: 2 },
      })));
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  // 2️⃣ Click an arrow (edge) to start Feynman Mode
  const startFeynman = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const a = nodes.find((n) => n.id === edge.source)?.data.label;
    const b = nodes.find((n) => n.id === edge.target)?.data.label;
    setConcepts({ a, b, rel: edge.label || "relates to" });
    setChatHistory([{ role: "assistant", content: `Let's explore: how does ${a} ${edge.label} ${b}? Explain it in your own words!` }]);
    setChatOpen(true);
  };

  // 3️⃣ CONNECT: Send chat to backend
  const sendChat = async () => {
    if (!chatInput.trim() || !concepts) return;
    const historyBefore = [...chatHistory];
    setChatHistory([...chatHistory, { role: "user", content: chatInput }]);
    setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/feynman-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept_a: concepts.a, concept_b: concepts.b, relationship: concepts.rel,
          chat_history: historyBefore, user_message: chatInput, level,
        }),
      });
      const data = await res.json();
      setChatHistory((h) => [...h, { role: "assistant", content: data.reply }]);
    } catch { setChatHistory((h) => [...h, { role: "assistant", content: "Connection error. Is the backend running on port 8000?" }]); }
    finally { setChatLoading(false); }
  };

  return (
    <main className="h-screen w-full flex flex-col bg-gray-50">
      <header className="p-4 bg-white shadow-md flex items-center justify-between border-b">
        <h1 className="text-2xl font-bold text-blue-600">🧠 Synapse AI</h1>
        <div className="flex items-center gap-3">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="border rounded-lg px-3 py-2 font-medium">
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <label className="cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Upload PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex-1 relative">
        {loading && <div className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center text-xl font-bold text-blue-600 animate-pulse">Synapse is thinking…</div>}
        {error && <div className="p-3 text-center text-red-600 bg-red-50">{error}</div>}
        {!loading && nodes.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-xl">Upload a PDF to generate your Knowledge Graph</div>
        )}
        {nodes.length > 0 && (
          <>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView onEdgeClick={(_, edge) => startFeynman(edge.id)}>
              <Background /> <Controls /> <MiniMap />
            </ReactFlow>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded-full text-sm text-gray-600 shadow">💡 Click any blue arrow to start Feynman Mode</div>
          </>
        )}

        {chatOpen && (
          <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl border-l flex flex-col z-40">
            <div className="p-3 bg-blue-600 text-white font-bold flex justify-between">
              <span>🧑‍🏫 Feynman Mode ({level})</span>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatHistory.map((m, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${m.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"}`}>{m.content}</div>
              ))}
              {chatLoading && <div className="text-gray-400 text-sm animate-pulse">Feynman is thinking…</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Explain in your own words…" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <button onClick={sendChat} className="bg-blue-600 text-white px-4 rounded-lg">Send</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}