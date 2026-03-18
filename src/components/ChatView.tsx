import { useState, useRef, useEffect } from "react";
import { Compass, Send, Sparkles, Paperclip, Heart, Atom, Globe, Cpu, Loader2, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useStreamChat } from "@/hooks/useStreamChat";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const suggestions = [
  { icon: Heart, label: "How does the human heart work?" },
  { icon: Atom, label: "Explain DNA structure" },
  { icon: Globe, label: "Solar System planets and orbits" },
  { icon: Cpu, label: "How does a car engine work?" },
];

export function ChatView() {
  const [input, setInput] = useState("");
  const { setMode } = useApp();
  const { messages, isLoading, send, clear } = useStreamChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 112) + "px";
    }
  }, [input]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    send(msg);
    setInput("");
  };

  const hasContent = input.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-border-subtle flex items-center justify-center mb-6">
                <Compass size={28} strokeWidth={1.5} className="text-tertiary-custom" />
              </div>
              <h2 className="text-xl font-semibold text-primary-custom mb-2">Explore any topic in 3D</h2>
              <p className="text-secondary-custom text-[15px] mb-8 max-w-sm leading-relaxed">
                Ask about science, biology, physics — get explanations with AI, then explore in 3D.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSend(s.label)}
                    className="flex items-center gap-2.5 px-4 py-3 bg-card border border-border rounded-xl text-[13px] text-secondary-custom hover:border-accent hover:text-accent transition-all duration-150 text-left group"
                  >
                    <s.icon size={15} strokeWidth={1.5} className="shrink-0 group-hover:text-accent" />
                    <span className="line-clamp-1">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className="animate-fade-in">
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-accent text-accent-foreground px-4 py-2.5 rounded-2xl rounded-br-md max-w-[72%] text-[15px] leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md max-w-[85%]">
                        <div className="prose prose-sm max-w-none text-[15px] text-primary-custom leading-relaxed prose-headings:text-primary-custom prose-strong:text-primary-custom prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        {/* Explore in 3D button */}
                        {msg.content.length > 50 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <button
                              onClick={() => setMode("learn")}
                              className="flex items-center gap-1.5 bg-accent/10 text-accent text-[12px] font-medium py-1.5 px-3 rounded-lg hover:bg-accent/20 transition-colors"
                            >
                              <Atom size={13} /> Explore in 3D
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-[13px] text-tertiary-custom">Thinking...</span>
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
      <div className="px-4 pb-4 md:pb-5 pb-20 md:pb-5">
        <div className="max-w-[720px] mx-auto">
          {messages.length > 0 && (
            <div className="flex justify-center mb-2">
              <button
                onClick={clear}
                className="flex items-center gap-1 text-[11px] text-tertiary-custom hover:text-secondary-custom transition-colors"
              >
                <Trash2 size={11} /> Clear chat
              </button>
            </div>
          )}
          <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-end gap-2.5 shadow-sm">
            <Paperclip size={16} strokeWidth={1.5} className="text-tertiary-custom mb-1.5 shrink-0 cursor-pointer hover:text-secondary-custom transition-colors" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything about science..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none min-h-[22px] max-h-28 leading-relaxed"
            />
            <Sparkles size={16} strokeWidth={1.5} className="text-accent mb-1.5 shrink-0 cursor-pointer hover:opacity-70 transition-opacity" />
            <button
              onClick={() => handleSend()}
              disabled={!hasContent || isLoading}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150 ${
                hasContent && !isLoading ? "bg-accent text-accent-foreground scale-100" : "bg-border text-tertiary-custom scale-95"
              }`}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={1.5} />}
            </button>
          </div>
          <p className="text-center text-[11px] text-tertiary-custom mt-2 opacity-60">
            Discoverse AI · Powered by Lovable Cloud
          </p>
        </div>
      </div>
    </div>
  );
}
