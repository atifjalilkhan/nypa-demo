import { useState, useRef, useEffect } from "react";

const SUGGESTED = [
  "Show all assets",
  "Show offline assets",
  "Show Niagara assets",
  "Show all work orders",
  "Show open work orders",
  "Show available technicians",
  "Create work order for AST-005 critical capacitor fault",
];

function formatResponse(data) {
  if (!data.success) return `❌ Error: ${data.message}`;

  if (data.intent === "HELP") return data.message;
  if (data.intent === "SUBMIT_WORK_ORDER_PROMPT") return data.message;

  if (data.intent === "WORK_ORDER_CREATED") {
    const d = data.data;
    return `✅ **Work Order Created**\n\n` +
      `**ID:** ${d.workOrderId}\n` +
      `**Asset:** ${d.asset?.name} (${d.asset?.facility})\n` +
      `**Priority:** ${d.priority}\n` +
      `**Status:** ${d.status}\n` +
      `**Assigned To:** ${d.assignedTech ? d.assignedTech.name + " (" + d.assignedTech.email + ")" : "Unassigned"}\n` +
      `**Submitted By:** ${d.submittedBy}`;
  }

  if (data.intent === "GET_AVAILABLE_TECHNICIANS") {
    if (!data.data?.length) return "No technicians currently available.";
    return `👷 **Available Technicians (${data.data.length})**\n\n` +
      data.data.map(t =>
        `• **${t.firstName} ${t.lastName}** — ${t.facility}\n  Skills: ${t.skillSet}\n  📧 ${t.email}`
      ).join("\n\n");
  }

  if (data.intent?.includes("WORK_ORDER")) {
    if (!data.data?.length) return "No work orders found.";
    return `📋 **Work Orders (${data.data.length})**\n\n` +
      data.data.map(w =>
        `• **${w.workOrderId}** — ${w.assetName}\n  📍 ${w.facility}\n  🔧 ${w.issueType}\n  Priority: **${w.priority}** | Status: **${w.status}**`
      ).join("\n\n");
  }

  if (data.intent?.includes("ASSET")) {
    if (!data.data?.length) return "No assets found.";
    const statusIcon = (s) => s === "OPERATIONAL" ? "🟢" : s === "DEGRADED" ? "🟡" : s === "OFFLINE" ? "🔴" : "🔧";
    return `⚡ **Assets (${data.data.length})**\n\n` +
      data.data.map(a =>
        `• ${statusIcon(a.status)} **${a.assetName}**\n  📍 ${a.facility} — ${a.location}\n  Type: ${a.assetType} | Condition: ${a.conditionScore}/10\n  ${a.notes}`
      ).join("\n\n");
  }

  return JSON.stringify(data, null, 2);
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const lines = msg.content.split("\n");

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#003087", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 16 }}>⚡</span>
        </div>
      )}
      <div style={{
        maxWidth: "75%", padding: "12px 16px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "#003087" : "white", color: isUser ? "white" : "#1a1a2e",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", fontSize: 14, lineHeight: 1.6,
        border: isUser ? "none" : "1px solid #e8ecf0"
      }}>
        {lines.map((line, i) => {
          const bold = line.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
          return <p key={i} style={{ margin: "2px 0" }} dangerouslySetInnerHTML={{ __html: bold }} />;
        })}
      </div>
      {isUser && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#00a651", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 10, flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>AJ</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: `Welcome to NYPA Asset & Work Order Management System! 👋\n\nI'm your AI-powered assistant connected to NYPA's live DB2 database. I can help you:\n\n⚡ View and monitor power assets\n📋 Create and track work orders\n👷 Find available field technicians\n🔔 Send notifications to assigned technicians\n\nWhat would you like to do today?`
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: formatResponse(data) }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Connection error: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#003087", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>⚡</div>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>NYPA Asset Management</div>
            <div style={{ color: "#7ec8e3", fontSize: 12 }}>New York Power Authority — AI-Powered Operations</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00a651" }}></div>
          <span style={{ color: "#7ec8e3", fontSize: 12 }}>Live DB2 Connected</span>
        </div>
      </div>

      {/* Suggested queries */}
      <div style={{ padding: "12px 24px", background: "#001f5b", display: "flex", gap: 8, overflowX: "auto", flexWrap: "wrap" }}>
        {SUGGESTED.map((s, i) => (
          <button key={i} onClick={() => send(s)} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            color: "white", padding: "6px 14px", borderRadius: 20, fontSize: 12,
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
          }}>{s}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", minHeight: "calc(100vh - 280px)" }}>
        {messages.map((m, i) => <Message key={i} msg={m} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#003087", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white" }}>⚡</span>
            </div>
            <div style={{ background: "white", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", border: "1px solid #e8ecf0", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#003087", animation: `bounce 1s infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e8ecf0", padding: "16px 24px", boxShadow: "0 -2px 8px rgba(0,0,0,0.08)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about assets, work orders, technicians..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "2px solid #e8ecf0", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            background: loading || !input.trim() ? "#ccc" : "#003087",
            color: "white", border: "none", borderRadius: 24, padding: "12px 24px",
            fontSize: 14, fontWeight: 600, cursor: loading || !input.trim() ? "not-allowed" : "pointer"
          }}>Send</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#999" }}>
          Bilqees Technology Solutions Inc. | NYC & NYS MBE Certified | Powered by Claude AI
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
