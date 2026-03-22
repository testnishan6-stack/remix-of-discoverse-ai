import { MessageSquare, BookOpen, Clock, User, LogOut, Shield, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export function AppSidebar() {
  const { mode, setMode } = useApp();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const handleNav = (target: "chat" | "learn") => { setMode(target); if (location.pathname !== "/app") navigate("/app"); };
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Explorer";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside className="hidden md:flex flex-col w-[240px] bg-card border-r border-border shrink-0 h-screen sticky top-0">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="text-[17px] font-black text-foreground tracking-tight">Discoverse</span>
        </div>
      </div>

      <nav className="px-3 space-y-0.5 flex-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider px-3 pb-1.5">Navigate</p>
        <SidebarItem icon={MessageSquare} label="Agents" active={mode === "chat" && !isAdminRoute && location.pathname === "/app"} onClick={() => handleNav("chat")} />
        <SidebarItem icon={BookOpen} label="Learn" active={mode === "learn" && !isAdminRoute && location.pathname === "/app"} onClick={() => handleNav("learn")} />
        <SidebarItem icon={Clock} label="Library" active={location.pathname === "/library"} onClick={() => navigate("/library")} />
        <SidebarItem icon={User} label="Profile" active={location.pathname === "/profile"} onClick={() => navigate("/profile")} />
        
        {isAdmin && (
          <>
            <div className="pt-4 pb-1.5 px-3"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Admin</p></div>
            <SidebarItem icon={Shield} label="Admin Panel" active={isAdminRoute} onClick={() => navigate("/admin")} />
          </>
        )}

        <div className="pt-4 pb-1.5 px-3"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Create</p></div>
        <SidebarItem icon={Sparkles} label="Create Agent" active={location.pathname === "/create-agent"} onClick={() => navigate("/create-agent")} />
      </nav>

      <div className="p-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
          {avatarUrl ? <img src={avatarUrl} className="w-9 h-9 rounded-xl object-cover" alt="" />
          : <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"><User size={15} strokeWidth={1.5} className="text-accent" /></div>}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="p-1.5 hover:bg-border rounded-lg transition-colors" title="Sign out">
            <LogOut size={14} strokeWidth={1.5} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<any>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 active:scale-[0.97] ${
        active ? "bg-accent/10 text-accent font-bold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}>
      <Icon size={16} strokeWidth={1.5} />{label}
    </button>
  );
}
