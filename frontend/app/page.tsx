"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  SmoothStepEdge,
} from "reactflow";
import "reactflow/dist/style.css";

const API_URL = "http://localhost:8000";
const LEVELS = ["Explain Like I'm 5", "Elementary", "High School", "College", "Expert"];

export default function Home() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState("High School");
  const [darkMode, setDarkMode] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [concepts, setConcepts] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const onNodesChange = useCallback((c: any) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: any) => setEdges((e) => applyEdgeChanges(c, e)), []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      
      // Better layout for nodes
      setNodes(data.graph.nodes.map((n: any, i: number) => ({
        id: String(n.id),
        data: { label: n.label },
        position: { x: (i % 3) * 350 + 50, y: Math.floor(i / 3) * 250 + 50 },
        className: "custom-node",
      })));
      
      setEdges(data.graph.edges.map((ed: any, i: number) => ({
        id: `e${i}`, source: String(ed.source), target: String(ed.target),
        label: ed.label, animated: true, type: "smoothstep",
        style: { stroke: darkMode ? "#60a5fa" : "#3b82f6", strokeWidth: 2 },
        labelStyle: { fill: darkMode ? "#e5e7eb" : "#374151", fontSize: 12, fontWeight: 600 },
        labelBgStyle: { fill: darkMode ? "#1f2937" : "#ffffff", fillOpacity: 0.8 },
      })));
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const startFeynman = (edgeId: string) => {
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
    } catch { setChatHistory((h) => [...h, { role: "assistant", content: "Connection error. Is the backend running on port 8000?" }]); }
    finally { setChatLoading(false); }
  };

  return (
    <main className={`h-screen w-full flex flex-col transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* --- HEADER --- */}
      <header className={`p-4 shadow-md flex items-center justify-between border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Synapse AI
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)} 
            className={`border rounded-lg px-3 py-2 font-medium transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <label className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition shadow-md">
            Upload PDF
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {/* --- LOADING STATE --- */}
        {loading && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center transition-colors ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'}`}>
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
              Synapse is thinking...
            </p>
          </div>
        )}

        {/* --- ERROR STATE --- */}
        {error && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border ${darkMode ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* --- LANDING / HOW IT WORKS STATE --- */}
        {!loading && nodes.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto">
            <h2 className="text-4xl font-extrabold mb-4 text-center">
              Transform Passive Reading into <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Active Learning</span>
            </h2>
            <p className={`text-lg mb-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload any educational PDF and watch Synapse AI build an interactive Knowledge Graph.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              {[
                { icon: "📄", title: "1. Upload PDF", desc: "Drop in any textbook chapter, lecture notes, or research paper." },
                { icon: "🕸️", title: "2. Generate Graph", desc: "Our AI extracts core concepts and maps their relationships instantly." },
                { icon: "🧑🏫", title: "3. Feynman Mode", desc: "Click any connection to test your understanding with our Socratic AI tutor." }
              ].map((step, i) => (
                <div key={i} className={`p-6 rounded-2xl border transition-all hover:scale-105 hover:shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- GRAPH CANVAS --- */}
        {nodes.length > 0 && (
          <>
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange} 
              fitView 
              onEdgeClick={(_, edge) => startFeynman(edge.id)}
              proOptions={{ hideAttribution: true }}
            >
              <Background color={darkMode ? "#374151" : "#e5e7eb"} gap={20} />
              <Controls className={darkMode ? '!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-white' : ''} />
              <MiniMap 
                nodeColor="#3b82f6" 
                maskColor={darkMode ? "rgba(17, 24, 39, 0.8)" : "rgba(243, 244, 246, 0.8)"}
                className={darkMode ? '!bg-gray-800 !border-gray-700' : ''}
              />
            </ReactFlow>
            
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-md backdrop-blur-sm transition-colors ${darkMode ? 'bg-gray-800/80 text-gray-200 border border-gray-700' : 'bg-white/80 text-gray-700 border border-gray-200'}`}>
              💡 Click any blue arrow to start Feynman Mode
            </div>
          </>
        )}

        {/* --- FEYNMAN CHAT SIDEBAR --- */}
        {chatOpen && (
          <div className={`absolute right-0 top-0 h-full w-96 shadow-2xl border-l flex flex-col z-40 transition-transform duration-300 transform ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex justify-between items-center">
              <span>🧑‍🏫 Feynman Mode ({level})</span>
              <button onClick={() => setChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : darkMode ? "bg-gray-700 text-gray-100 rounded-bl-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl rounded-bl-none text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <span className="animate-pulse">Feynman is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className={`p-4 border-t flex gap-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <input 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && sendChat()} 
                placeholder="Explain in your own words..." 
                className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`} 
              />
              <button onClick={sendChat} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 rounded-xl font-medium hover:opacity-90 transition">Send</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}