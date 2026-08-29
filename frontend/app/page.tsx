"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, { Controls, Background, MiniMap, applyNodeChanges, applyEdgeChanges } from "reactflow";
import "reactflow/dist/style.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LEVELS = ["Explain Like I'm 5", "Elementary", "High School", "College", "Expert"];

interface HistoryEntry {
  id: string;
  filename: string;
  level: string;
  timestamp: number;
  nodes: any[];
  edges: any[];
}

export default function Home() {
  const [view, setView] = useState<"landing" | "app">("landing");
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

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    try {
      const saved = localStorage.getItem("synapse_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const onNodesChange = useCallback((c: any) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: any) => setEdges((e) => applyEdgeChanges(c, e)), []);

  const saveToHistory = (filename: string, lvl: string, n: any[], e: any[]) => {
    setHistory((prev) => {
      const entry: HistoryEntry = { id: Date.now().toString(), filename, level: lvl, timestamp: Date.now(), nodes: n, edges: e };
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem("synapse_history", JSON.stringify(updated));
      return updated;
    });
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setLevel(entry.level);
    setHistoryOpen(false);
    setChatOpen(false);
  };

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

      const flowNodes = data.graph.nodes.map((n: any, i: number) => ({
        id: String(n.id),
        data: { label: n.label },
        position: { x: (i % 3) * 350 + 50, y: Math.floor(i / 3) * 250 + 50 },
        className: "custom-node",
      }));
      const flowEdges = data.graph.edges.map((ed: any, i: number) => ({
        id: `e${i}`, source: String(ed.source), target: String(ed.target),
        label: ed.label, animated: true, type: "smoothstep",
        style: { stroke: "#60a5fa", strokeWidth: 2 },
        labelStyle: { fill: "#e5e7eb", fontSize: 12, fontWeight: 600 },
        labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
      saveToHistory(file.name, level, flowNodes, flowEdges);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const startSage = (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const a = nodes.find((n) => n.id === edge.source)?.data.label;
    const b = nodes.find((n) => n.id === edge.target)?.data.label;
    setConcepts({ a, b, rel: edge.label || "relates to" });
    setChatHistory([{ role: "assistant", content: `Let's explore: how does ${a} ${edge.label} ${b}? Explain it in your own words!` }]);
    setChatOpen(true);
  };

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
    } catch { setChatHistory((h) => [...h, { role: "assistant", content: "Connection error. Is the backend running?" }]); }
    finally { setChatLoading(false); }
  };

  /* ============ LANDING PAGE ============ */
  if (view === "landing") {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <span className="text-7xl mb-6 animate-bounce">🧠</span>
          <h1 className="text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
            Synapse AI
          </h1>
          <p className="text-2xl text-gray-300 mb-2 max-w-2xl">Transform passive reading into <span className="text-emerald-400 font-bold">active learning</span>.</p>
          <p className="text-gray-500 mb-10 max-w-xl">Upload any educational PDF and watch AI build an interactive Knowledge Graph, then master it with Sage — your Socratic tutor.</p>
          <button onClick={() => setView("app")} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xl font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-purple-900/50 transition-all hover:scale-105">
            Enter Synapse →
          </button>
        </div>

        <section className="max-w-5xl mx-auto p-8 w-full">
          <h2 className="text-3xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: "📄", title: "1. Upload PDF", desc: "Drop in any textbook chapter, lecture notes, or research paper." },
              { icon: "🕸️", title: "2. Explore Graph", desc: "AI extracts core concepts and maps their relationships instantly." },
              { icon: "🌿", title: "3. Sage Mode", desc: "Click any connection and get quizzed by a tutor that never gives the answer." },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-700 hover:scale-105 transition-all">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        
          
        </section>
      </main>
    );
  }

  /* ============ APP (DARK ONLY) ============ */
  return (
    <main className="h-screen w-full flex flex-col bg-gray-950 text-white">
      <header className="p-4 shadow-md flex items-center justify-between border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("landing")} className="text-gray-400 hover:text-white transition text-sm px-2 py-1 rounded-lg hover:bg-gray-800">← Home</button>
          <span className="text-2xl">🧠</span>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Synapse AI</h1>
        </div>
        <div className="flex items-center gap-3">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-medium text-white">
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button onClick={() => setHistoryOpen(!historyOpen)} className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition font-medium">
            🕘 History {history.length > 0 && `(${history.length})`}
          </button>
          <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition shadow-md">
            Upload PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/90">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">Synapse is thinking...</p>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border bg-red-900/50 border-red-700 text-red-200">{error}</div>
        )}

        {!loading && nodes.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <span className="text-6xl mb-4">🕸️</span>
            <p className="text-xl font-medium">Upload a PDF to generate your Knowledge Graph</p>
            <p className="text-sm mt-2">or open one from your History</p>
          </div>
        )}

        {nodes.length > 0 && (
          <>
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView onEdgeClick={(_, edge) => startSage(edge.id)} proOptions={{ hideAttribution: true }}>
              <Background color="#1f2937" gap={20} />
              <Controls className="!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-white" />
              <MiniMap nodeColor="#3b82f6" maskColor="rgba(3, 7, 18, 0.8)" className="!bg-gray-800 !border-gray-700" />
            </ReactFlow>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-md bg-gray-900/80 text-gray-200 border border-gray-700">
              🌿 Click any arrow to start Sage Mode
            </div>
          </>
        )}

        {/* --- HISTORY SIDEBAR --- */}
        {historyOpen && (
          <div className="absolute left-0 top-0 h-full w-80 bg-gray-900 border-r border-gray-800 shadow-2xl z-40 flex flex-col">
            <div className="p-4 border-b border-gray-800 font-bold flex justify-between items-center">
              <span>🕘 Your Graphs</span>
              <button onClick={() => setHistoryOpen(false)} className="hover:bg-gray-800 p-1 rounded-full">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 && <p className="text-gray-500 text-sm text-center mt-8">No graphs yet. Upload a PDF!</p>}
              {history.map((h) => (
                <button key={h.id} onClick={() => loadFromHistory(h)} className="w-full text-left p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 transition">
                  <p className="font-semibold text-sm truncate">📄 {h.filename}</p>
                  <p className="text-xs text-gray-400 mt-1">{h.level} • {new Date(h.timestamp).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- SAGE CHAT SIDEBAR --- */}
        {chatOpen && (
          <div className="absolute right-0 top-0 h-full w-96 shadow-2xl border-l border-gray-700 flex flex-col z-40 bg-gray-900">
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex justify-between items-center">
              <span>🌿 Sage Mode ({level})</span>
              <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-gray-800 text-gray-100 rounded-bl-none"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl rounded-bl-none text-sm bg-gray-800"><span className="animate-pulse">Sage is thinking...</span></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Explain in your own words..." className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={sendChat} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 rounded-xl font-medium hover:opacity-90 transition">Send</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}