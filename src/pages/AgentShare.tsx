import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStreamChat } from "@/hooks/useStreamChat";
import { Logo } from "@/components/Logo";
import { Bot, Send, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AgentShare() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const { messages, isLoading, send, clear } = useStreamChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      setAgent(data);
      setLoading(false);
    };
    if (slug) load();
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    send(msg, agent?.id);
    setInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <Bot size={48} className="text-border mb-4" />
        <h1 className="text-[20px] font-semibold text-primary-custom mb-2">Agent not found</h1>
        <p className="text-[14px] text-secondary-custom mb-6">This agent may have been removed or unpublished.</p>
        <button onClick={() => navigate("/")} className="text-accent text-[14px] font-medium hover:underline">Go to Discoverse →</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft size={18} className="text-secondary-custom" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Bot size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-primary-custom truncate">{agent.name}</p>
          <p className="text-[10px] text-tertiary-custom truncate">{agent.personality}</p>
        </div>
        <Logo size={20} />
      </header>

      {/* SEO-friendly deep link notice */}
      {/* Share URL: discoverseai.com/agent/{slug} */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Bot size={28} className="text-accent" />
              </div>
              <h2 className="text-[18px] font-semibold text-primary-custom mb-2">{agent.name}</h2>
              <p className="text-[13px] text-secondary-custom leading-relaxed max-w-sm mb-6">{agent.greeting_message}</p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {(agent.knowledge_areas || []).slice(0, 4).map((area: string) => (
                  <button
                    key={area}
                    onClick={() => handleSend(`Tell me about ${area}`)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-card border border-border rounded-xl text-[12px] text-secondary-custom hover:border-accent hover:text-accent transition-all text-left active:scale-[0.97]"
                  >
                    <Sparkles size={12} className="shrink-0 text-accent" />
                    Tell me about {area}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="animate-fade-in">
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-accent text-accent-foreground px-3.5 py-2 rounded-2xl rounded-br-md max-w-[80%] text-[13px] leading-relaxed">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="flex justify-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot size={12} className="text-accent" />
                      </div>
                      <div className="bg-card border border-border px-3.5 py-2.5 rounded-2xl rounded-bl-md max-w-[85%]">
                        <div className="prose prose-sm max-w-none text-[13px] text-primary-custom leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-accent" />
                  </div>
                  <div className="bg-card border border-border px-3.5 py-2.5 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-tertiary-custom" style={{ animation: `pulse-dot 1.2s ease-in-out infinite ${i * 200}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 safe-area-bottom">
        <div className="max-w-[720px] mx-auto">
          <div className="bg-card border border-border rounded-2xl px-3 py-2.5 flex items-end gap-2 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ask ${agent.name}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none min-h-[20px] max-h-28 leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-[0.95] ${input.trim() && !isLoading ? "bg-accent text-accent-foreground" : "bg-border text-tertiary-custom"}`}
            >
              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>
          {!user && (
            <p className="text-center text-[10px] text-tertiary-custom mt-2">
              <button onClick={() => navigate("/auth")} className="text-accent hover:underline">Sign up</button> for unlimited access
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
