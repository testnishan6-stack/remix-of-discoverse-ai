import { User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function TopBar({ title }: { title?: string }) {
  const { mode, setMode, language, setLanguage } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center px-4 md:px-5 gap-3 shrink-0 sticky top-0 z-30">
      <div className="md:hidden"><Logo size={22} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-black text-foreground truncate">{title || "Discoverse"}</p>
      </div>
      <div className="bg-secondary rounded-xl p-[3px] flex">
        {(["chat", "learn"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-[12px] rounded-lg transition-all duration-150 capitalize font-bold ${
              mode === m ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>{m}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl overflow-hidden border border-border h-8">
          {(["en", "hi"] as const).map((l) => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`px-2.5 text-[11px] font-bold transition-colors duration-150 ${language === l ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
              {l === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
        <button onClick={() => navigate("/profile")} className="shrink-0">
          {avatarUrl ? <img src={avatarUrl} className="w-8 h-8 rounded-xl object-cover" alt="" />
          : <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center"><User size={14} strokeWidth={1.5} className="text-accent" /></div>}
        </button>
      </div>
    </header>
  );
}
