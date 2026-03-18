import { Compass, MessageSquare, BookOpen, Clock, Settings, User, LogOut, Shield } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export function AppSidebar() {
  const { mode, setMode } = useApp();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const handleNav = (target: "chat" | "learn") => {
    setMode(target);
    if (location.pathname !== "/") navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Explorer";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <aside className="hidden md:flex flex-col w-60 bg-background-secondary border-r border-border shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Compass className="text-accent" size={18} strokeWidth={1.5} />
          </div>
          <span className="text-[17px] font-semibold text-primary-custom tracking-tight">Discoverse</span>
        </div>
        <p className="text-tertiary-custom text-xs mt-3 ml-0.5">Hello, {displayName.split(" ")[0]}</p>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        <SidebarItem
          icon={MessageSquare}
          label="Chat"
          active={mode === "chat" && !isAdminRoute && location.pathname === "/"}
          onClick={() => handleNav("chat")}
        />
        <SidebarItem
          icon={BookOpen}
          label="Learn"
          active={mode === "learn" && !isAdminRoute && location.pathname === "/"}
          onClick={() => handleNav("learn")}
        />
        <SidebarItem
          icon={Clock}
          label="Library"
          active={location.pathname === "/library"}
          onClick={() => navigate("/library")}
        />
        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="label-text text-tertiary-custom">Admin</p>
            </div>
            <SidebarItem
              icon={Shield}
              label="Admin Panel"
              active={isAdminRoute}
              onClick={() => navigate("/admin")}
            />
          </>
        )}
      </nav>

      {/* User */}
      <div className="mt-auto p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-border-subtle transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <User size={14} strokeWidth={1.5} className="text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-primary-custom truncate">{displayName}</p>
            <p className="text-[11px] text-tertiary-custom truncate">{user?.email}</p>
          </div>
          <button onClick={signOut} className="p-1 hover:bg-border rounded transition-colors" title="Sign out">
            <LogOut size={14} strokeWidth={1.5} className="text-tertiary-custom" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<any>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
        active
          ? "bg-accent-subtle text-accent font-medium border-l-2 border-accent -ml-px"
          : "text-secondary-custom hover:bg-border-subtle"
      }`}
    >
      <Icon size={16} strokeWidth={1.5} />
      {label}
    </button>
  );
}
