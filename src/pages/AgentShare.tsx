import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStreamChat } from "@/hooks/useStreamChat";
import { Logo } from "@/components/Logo";
import { Bot, Send, Loader2, Sparkles, ArrowLeft, Share2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { shareUrl } from "@/lib/constants";

export default function AgentShare() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
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

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl(`/agent/${slug}`));
    setCopied(true);
    toast.success("Agent link copied!");
    setTimeout(() => setCopied(false), 2000);
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
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Bot size={28} className="text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Agent not found</h1>
        <p className="text-sm text-muted-foreground mb-6">This agent may have been removed or unpublished.</p>
        <button onClick={() => navigate("/")} className="text-accent text-sm font-semibold hover:underline">Go to Discoverse →</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 gap-3 shrink-0 sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center overflow-hidden">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Bot size={18} className="text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{agent.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{agent.personality}</p>
        </div>
        <button onClick={handleShare} className="p-2 hover:bg-secondary rounded-xl transition-colors">
          {copied ? <Check size={16} className="text-accent" /> : <Share2 size={16} className="text-muted-foreground" />}
        </button>
        <Logo size={20} />
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center mb-5 overflow-hidden">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Bot size={32} className="text-accent" />
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{agent.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">{agent.greeting_message}</p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                {(agent.knowledge_areas || []).slice(0, 4).map((area: string) => (
                  <button key={area} onClick={() => handleSend(`Tell me about ${area}`)}
                    className="flex items-center gap-2 px-4 py-3 bg-card border border-border rounded-xl text-xs text-muted-foreground hover:border-accent hover:text-accent transition-all text-left active:scale-[0.97] group">
                    <Sparkles size={12} className="shrink-0 text-accent group-hover:scale-110 transition-transform" />
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
                      <div className="bg-accent text-accent-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%] text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="flex justify-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Bot size={13} className="text-accent" />
                        )}
                      </div>
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]">
                        <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot size={13} className="text-accent" />
                  </div>
                  <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animation: `pulse-dot 1.2s ease-in-out infinite ${i * 200}ms` }} />
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
          <div className="bg-card border border-border rounded-2xl px-3.5 py-2.5 flex items-end gap-2 shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Ask ${agent.name}...`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[20px] max-h-28 leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-[0.95] ${input.trim() && !isLoading ? "bg-accent text-accent-foreground shadow-sm" : "bg-border text-muted-foreground"}`}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          {!user && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              <button onClick={() => navigate("/auth")} className="text-accent font-semibold hover:underline">Sign up</button> for unlimited access & collaboration
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
