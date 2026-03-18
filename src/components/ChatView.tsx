import { useState } from "react";
import { Compass, Send, Sparkles, Paperclip, Heart, Atom, Globe, Cpu } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  simulation?: { title: string; subject: string };
}

const suggestions = [
  { icon: Heart, label: "How does the human heart work?" },
  { icon: Atom, label: "Explain DNA structure" },
  { icon: Globe, label: "Solar System planets and orbits" },
  { icon: Cpu, label: "How does a car engine work?" },
];

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { setMode } = useApp();

  const sendMessage = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;
    const userMsg: Message = { id: Date.now(), role: "user", text: msg };
    const aiMsg: Message = {
      id: Date.now() + 1,
      role: "ai",
      text: `I found a relevant 3D model for "${msg}". I'm preparing an interactive simulation with step-by-step narration for you.`,
      simulation: { title: msg, subject: "Science" },
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  const hasContent = input.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-border-subtle flex items-center justify-center mb-6">
                <Compass size={28} strokeWidth={1.5} className="text-tertiary-custom" />
              </div>
              <h2 className="text-xl font-semibold text-primary-custom mb-2">Explore any topic in 3D</h2>
              <p className="text-secondary-custom text-[15px] mb-8 max-w-sm leading-relaxed">
                Ask about science, biology, physics — get an interactive 3D experience with AI narration.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.label)}
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
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md max-w-[80%]">
                        <p className="text-[15px] text-primary-custom leading-relaxed">{msg.text}</p>
                        {msg.simulation && (
                          <div className="mt-3 border border-border rounded-xl overflow-hidden">
                            <div className="h-40 bg-canvas flex items-center justify-center">
                              <Atom size={36} strokeWidth={1} className="text-tertiary-custom" />
                            </div>
                            <div className="p-3 flex gap-2">
                              <button
                                onClick={() => setMode("learn")}
                                className="flex-1 bg-accent text-accent-foreground text-[13px] font-medium py-2 rounded-lg hover:opacity-90 transition-opacity"
                              >
                                View in 3D
                              </button>
                              <button className="flex-1 border border-border text-secondary-custom text-[13px] font-medium py-2 rounded-lg hover:bg-background-secondary transition-colors">
                                Save to Library
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 md:pb-5 pb-20 md:pb-5">
        <div className="max-w-[680px] mx-auto">
          <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-end gap-2.5 shadow-sm">
            <Paperclip size={16} strokeWidth={1.5} className="text-tertiary-custom mb-1.5 shrink-0 cursor-pointer hover:text-secondary-custom transition-colors" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything about science..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none min-h-[22px] max-h-28 leading-relaxed"
            />
            <Sparkles size={16} strokeWidth={1.5} className="text-accent mb-1.5 shrink-0 cursor-pointer hover:opacity-70 transition-opacity" />
            <button
              onClick={() => sendMessage()}
              disabled={!hasContent}
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150 ${
                hasContent ? "bg-accent text-accent-foreground scale-100" : "bg-border text-tertiary-custom scale-95"
              }`}
            >
              <Send size={13} strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-center text-[11px] text-tertiary-custom mt-2 opacity-60">
            Discoverse can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
