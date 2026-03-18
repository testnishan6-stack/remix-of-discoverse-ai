import { Bell, User } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

export function TopBar({ title }: { title?: string }) {
  const { mode, setMode, language, setLanguage } = useApp();
  const { user } = useAuth();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="h-14 bg-card border-b border-subtle flex items-center px-5 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-primary-custom truncate">{title || "Discoverse"}</p>
      </div>

      {/* Mode switcher */}
      <div className="bg-border-subtle rounded-lg p-[3px] flex">
        {(["chat", "learn"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-[13px] rounded-md transition-all duration-150 capitalize ${
              mode === m
                ? "bg-card border border-border shadow-sm font-medium text-primary-custom"
                : "text-secondary-custom hover:text-primary-custom"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Language toggle */}
        <div className="flex rounded-full overflow-hidden border border-border h-7">
          {(["en", "hi"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`px-2.5 text-[11px] font-medium transition-colors duration-150 ${
                language === l ? "bg-accent text-accent-foreground" : "text-secondary-custom hover:text-primary-custom"
              }`}
            >
              {l === "en" ? "EN" : "हिं"}
            </button>
          ))}
        </div>
        <Bell size={16} strokeWidth={1.5} className="text-tertiary-custom cursor-pointer hover:text-secondary-custom transition-colors" />
        {avatarUrl ? (
          <img src={avatarUrl} className="w-7 h-7 rounded-full object-cover" alt="" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
            <User size={13} strokeWidth={1.5} className="text-accent" />
          </div>
        )}
      </div>
    </header>
  );
}
