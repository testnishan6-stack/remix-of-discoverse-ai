import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import {
  Database, Upload, BarChart3, Layers, Plus, X, CloudUpload, Check,
  AlertTriangle, Bot, Sparkles, Eye, EyeOff, Save, Trash2, ChevronRight,
  Users, Mail, Shield, Activity, Settings, Power, Key, RefreshCw,
  CheckCircle, XCircle, Clock, Crown,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const adminNav = [
  { icon: Activity, label: "Health", path: "/admin/health" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: Mail, label: "Contacts", path: "/admin/contacts" },
  { icon: Bot, label: "AI Agents", path: "/admin/agents" },
  { icon: Database, label: "Models", path: "/admin" },
  { icon: Upload, label: "Upload", path: "/admin/upload" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Layers, label: "Cache", path: "/admin/cache" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const subjectColors: Record<string, string> = {
  biology: "bg-green-50 text-green-700",
  physics: "bg-blue-50 text-blue-700",
  chemistry: "bg-purple-50 text-purple-700",
  astronomy: "bg-indigo-50 text-indigo-700",
  engineering: "bg-orange-50 text-orange-700",
  mathematics: "bg-pink-50 text-pink-700",
};

function getView(path: string) {
  if (path.includes("/health")) return "health";
  if (path.includes("/users")) return "users";
  if (path.includes("/contacts")) return "contacts";
  if (path.includes("/agents")) return "agents";
  if (path.includes("/upload")) return "upload";
  if (path.includes("/analytics")) return "analytics";
  if (path.includes("/cache")) return "cache";
  if (path.includes("/settings")) return "settings";
  return "models";
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <MainLayout title="Admin">
        <div className="flex flex-col items-center justify-center h-full">
          <AlertTriangle size={32} strokeWidth={1.5} className="text-accent mb-3" />
          <h2 className="text-lg font-semibold text-primary-custom">Access Denied</h2>
          <p className="text-[13px] text-secondary-custom mt-1">You need admin privileges to access this panel.</p>
        </div>
      </MainLayout>
    );
  }

  const currentView = getView(location.pathname);

  return (
    <MainLayout title="Admin Panel">
      <div className="flex h-full">
        <div className="hidden md:block w-44 bg-background-secondary border-r border-border p-2.5 space-y-0.5 shrink-0 overflow-y-auto">
          <p className="label-text text-tertiary-custom px-3 py-2">Admin</p>
          {adminNav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                location.pathname === item.path || (item.path === "/admin" && location.pathname === "/admin" && currentView === "models")
                  ? "bg-accent-subtle text-accent font-medium" : "text-secondary-custom hover:bg-border-subtle"
              }`}
            >
              <item.icon size={15} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:hidden absolute top-0 left-0 right-0 z-10 bg-card border-b border-border flex overflow-x-auto px-2 py-1.5 gap-1">
          {adminNav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-secondary-custom bg-background-secondary"
              }`}
            >
              <item.icon size={12} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-12 md:pt-8 pb-20 md:pb-8">
          {currentView === "health" ? <HealthView /> :
           currentView === "users" ? <UsersView /> :
           currentView === "contacts" ? <ContactsView /> :
           currentView === "agents" ? <AgentsView /> :
           currentView === "upload" ? <UploadView /> :
           currentView === "analytics" ? <AnalyticsView /> :
           currentView === "settings" ? <SettingsView /> :
           <ModelsTable />}
        </div>
      </div>
    </MainLayout>
  );
}

// ── HEALTH CHECK VIEW ──
function HealthView() {
  const [checks, setChecks] = useState<{ name: string; status: "ok" | "error" | "checking"; detail: string }[]>([]);
  const [checking, setChecking] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    const results: typeof checks = [];

    // DB connection
    try {
      const { data, error } = await supabase.from("platform_settings").select("key").limit(1);
      results.push({ name: "Database Connection", status: error ? "error" : "ok", detail: error ? error.message : "Connected" });
    } catch { results.push({ name: "Database Connection", status: "error", detail: "Failed" }); }

    // Auth service
    try {
      const { error } = await supabase.auth.getSession();
      results.push({ name: "Authentication Service", status: error ? "error" : "ok", detail: error ? error.message : "Operational" });
    } catch { results.push({ name: "Authentication Service", status: "error", detail: "Failed" }); }

    // Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      results.push({ name: "Storage Service", status: error ? "error" : "ok", detail: error ? error.message : `${data?.length || 0} buckets` });
    } catch { results.push({ name: "Storage Service", status: "error", detail: "Failed" }); }

    // Chat Edge Function
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "OPTIONS",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      results.push({ name: "Chat Edge Function", status: r.ok || r.status === 204 ? "ok" : "error", detail: r.ok || r.status === 204 ? "Responding" : `Status ${r.status}` });
    } catch { results.push({ name: "Chat Edge Function", status: "error", detail: "Unreachable" }); }

    // TTS Edge Function
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: "OPTIONS",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      results.push({ name: "TTS Edge Function", status: r.ok || r.status === 204 ? "ok" : "error", detail: r.ok || r.status === 204 ? "Responding" : `Status ${r.status}` });
    } catch { results.push({ name: "TTS Edge Function", status: "error", detail: "Unreachable" }); }

    // Enhance Model Edge Function
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhance-model`, {
        method: "OPTIONS",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      results.push({ name: "Enhance Model Function", status: r.ok || r.status === 204 ? "ok" : "error", detail: r.ok || r.status === 204 ? "Responding" : `Status ${r.status}` });
    } catch { results.push({ name: "Enhance Model Function", status: "error", detail: "Unreachable" }); }

    // 3D Model Gen
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-3d-model`, {
        method: "OPTIONS",
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      results.push({ name: "3D Model Generator", status: r.ok || r.status === 204 ? "ok" : "error", detail: r.ok || r.status === 204 ? "Responding" : `Status ${r.status}` });
    } catch { results.push({ name: "3D Model Generator", status: "error", detail: "Unreachable" }); }

    // Models count
    try {
      const { count, error } = await supabase.from("models").select("id", { count: "exact", head: true });
      results.push({ name: "3D Models Database", status: error ? "error" : "ok", detail: error ? error.message : `${count || 0} models` });
    } catch { results.push({ name: "3D Models Database", status: "error", detail: "Failed" }); }

    // AI Agents count
    try {
      const { count, error } = await supabase.from("ai_agents").select("id", { count: "exact", head: true });
      results.push({ name: "AI Agents Database", status: error ? "error" : "ok", detail: error ? error.message : `${count || 0} agents` });
    } catch { results.push({ name: "AI Agents Database", status: "error", detail: "Failed" }); }

    // Maintenance mode
    try {
      const { data } = await supabase.from("platform_settings").select("value").eq("key", "maintenance_mode").maybeSingle();
      const val = data?.value as { enabled?: boolean } | null;
      results.push({ name: "Maintenance Mode", status: val?.enabled ? "error" : "ok", detail: val?.enabled ? "⚠️ ENABLED" : "Disabled" });
    } catch { results.push({ name: "Maintenance Mode", status: "error", detail: "Can't read" }); }

    setChecks(results);
    setChecking(false);
  };

  useEffect(() => { runChecks(); }, []);

  const okCount = checks.filter(c => c.status === "ok").length;
  const errCount = checks.filter(c => c.status === "error").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-primary-custom">Platform Health</h1>
          <p className="text-[12px] text-tertiary-custom mt-0.5">
            {checks.length > 0 ? `${okCount} healthy, ${errCount} issues` : "Running diagnostics..."}
          </p>
        </div>
        <button onClick={runChecks} disabled={checking}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97] disabled:opacity-40">
          <RefreshCw size={14} className={checking ? "animate-spin" : ""} /> Recheck
        </button>
      </div>

      <div className="grid gap-2">
        {checks.map((check) => (
          <div key={check.name} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            {check.status === "ok" ? <CheckCircle size={18} className="text-green-600 shrink-0" /> :
             check.status === "error" ? <XCircle size={18} className="text-red-500 shrink-0" /> :
             <Clock size={18} className="text-amber-500 animate-spin shrink-0" />}
            <div className="flex-1">
              <p className="text-[13px] font-medium text-primary-custom">{check.name}</p>
              <p className="text-[11px] text-tertiary-custom">{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── USERS VIEW ──
function UsersView() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(profileData || []);
    const { data: roleData } = await supabase.from("user_roles").select("user_id, role");
    const roleMap: Record<string, string> = {};
    (roleData || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setRoles(roleMap);
    setLoading(false);
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "student" : "admin";
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) { toast.error("Failed to update role"); return; }
    setRoles(prev => ({ ...prev, [userId]: newRole }));
    toast.success(`Role updated to ${newRole}`);
  };

  const allowAgentCreation = async (userId: string) => {
    const { error } = await supabase.from("agent_creator_applications").update({ status: "approved" }).eq("user_id", userId);
    if (error) toast.error("Failed"); else toast.success("Agent creation approved");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-primary-custom">Users</h1>
          <p className="text-[12px] text-tertiary-custom mt-0.5">{profiles.length} registered users</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary">
                  {["User", "Role", "Joined", "Actions"].map(h => (
                    <th key={h} className="label-text text-tertiary-custom text-left px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-background-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0">
                          {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <Users size={14} className="text-accent" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-primary-custom">{p.display_name || "Unknown"}</p>
                          <p className="text-[10px] text-tertiary-custom">{p.username || p.user_id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roles[p.user_id] === "admin" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                        {roles[p.user_id] || "student"}
                      </span>
                    </td>
                    <td className="px-4 text-[12px] text-secondary-custom">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleRole(p.user_id, roles[p.user_id] || "student")}
                          className="text-[10px] px-2.5 py-1 bg-background-secondary rounded-lg hover:bg-accent/10 text-secondary-custom hover:text-accent transition-colors font-medium"
                          title={roles[p.user_id] === "admin" ? "Remove admin" : "Make admin"}>
                          <Shield size={12} />
                        </button>
                        <button onClick={() => allowAgentCreation(p.user_id)}
                          className="text-[10px] px-2.5 py-1 bg-background-secondary rounded-lg hover:bg-accent/10 text-secondary-custom hover:text-accent transition-colors font-medium"
                          title="Allow agent creation">
                          <Bot size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CONTACTS VIEW ──
function ContactsView() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setContacts(data || []); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-semibold text-primary-custom">Contact Submissions</h1>
        <p className="text-[12px] text-tertiary-custom mt-0.5">{contacts.length} messages received</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-card">
          <Mail size={32} strokeWidth={1} className="text-border mb-3" />
          <p className="text-[14px] text-secondary-custom">No contact submissions yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[14px] font-semibold text-primary-custom">{c.name}</p>
                  <p className="text-[11px] text-accent">{c.email}</p>
                </div>
                <span className="text-[10px] text-tertiary-custom">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-[11px] text-accent font-medium mb-1">{c.subject}</p>
              <p className="text-[13px] text-secondary-custom leading-relaxed">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS VIEW ──
function AnalyticsView() {
  const [stats, setStats] = useState({ totalUsers: 0, totalModels: 0, totalAgents: 0, totalChats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, models, agents, chats] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("models").select("id", { count: "exact", head: true }),
        supabase.from("ai_agents").select("id", { count: "exact", head: true }),
        supabase.from("conversation_history").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        totalUsers: users.count || 0,
        totalModels: models.count || 0,
        totalAgents: agents.count || 0,
        totalChats: chats.count || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "3D Models", value: stats.totalModels, icon: Database, color: "text-green-600" },
    { label: "AI Agents", value: stats.totalAgents, icon: Bot, color: "text-purple-600" },
    { label: "Conversations", value: stats.totalChats, icon: Mail, color: "text-amber-600" },
  ];

  return (
    <div>
      <h1 className="text-[20px] font-semibold text-primary-custom mb-5">Analytics</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4">
              <c.icon size={20} className={`${c.color} mb-2`} />
              <p className="text-2xl font-bold text-primary-custom">{c.value}</p>
              <p className="text-[11px] text-tertiary-custom">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SETTINGS VIEW (Maintenance + API Keys) ──
function SettingsView() {
  const { user } = useAuth();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("Platform is under maintenance. Please check back soon.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("platform_settings").select("key, value").eq("key", "maintenance_mode").maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as { enabled?: boolean; message?: string };
          setMaintenanceEnabled(!!v.enabled);
          setMaintenanceMsg(v.message || "");
        }
        setLoading(false);
      });
  }, []);

  const saveMaintenance = async () => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings")
      .update({ value: { enabled: maintenanceEnabled, message: maintenanceMsg }, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq("key", "maintenance_mode");
    if (error) toast.error("Failed to save"); else toast.success(maintenanceEnabled ? "Maintenance mode ON" : "Maintenance mode OFF");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-[20px] font-semibold text-primary-custom">Platform Settings</h1>

      {/* Maintenance Mode */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Power size={18} className={maintenanceEnabled ? "text-red-500" : "text-green-600"} />
            <h2 className="text-[15px] font-semibold text-primary-custom">Maintenance Mode</h2>
          </div>
          <button onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${maintenanceEnabled ? "bg-red-500" : "bg-green-500"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${maintenanceEnabled ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
        <textarea value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} rows={2}
          className="w-full bg-background-secondary border border-border rounded-xl px-3 py-2 text-[13px] text-primary-custom focus:outline-none focus:border-accent resize-none mb-3"
          placeholder="Maintenance message..." />
        <button onClick={saveMaintenance} disabled={saving}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-[13px] font-medium hover:opacity-90 disabled:opacity-40">
          <Save size={14} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* API Key Management Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Key size={18} className="text-accent" />
          <h2 className="text-[15px] font-semibold text-primary-custom">API Keys</h2>
        </div>
        <p className="text-[12px] text-secondary-custom mb-3">API keys are managed securely through the backend. Contact the development team to rotate keys.</p>
        <div className="space-y-2">
          {["LOVABLE_API_KEY", "ELEVENLABS_API_KEY"].map(key => (
            <div key={key} className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2">
              <span className="text-[12px] font-mono text-primary-custom">{key}</span>
              <CheckCircle size={14} className="text-green-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Usage Limits */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={18} className="text-accent" />
          <h2 className="text-[15px] font-semibold text-primary-custom">Usage Limits (Free Tier)</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2">
            <span className="text-[12px] text-primary-custom">Chats per day</span>
            <span className="text-[13px] font-semibold text-accent">3</span>
          </div>
          <div className="flex items-center justify-between bg-background-secondary rounded-lg px-3 py-2">
            <span className="text-[12px] text-primary-custom">3D Generations per day</span>
            <span className="text-[13px] font-semibold text-accent">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI AGENTS VIEW ──
function AgentsView() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    const { data } = await supabase.from("ai_agents").select("*").order("created_at", { ascending: false });
    setAgents(data || []);
    setLoading(false);
  };

  const createNew = () => {
    setEditing({
      name: "",
      slug: "",
      personality: "warm, friendly science guide who explains things like a close friend",
      system_prompt: `You are a warm, experienced science guide. Your style:
- Talk like a close friend, not a teacher
- Use Hindi naturally mixed with English science terms
- Be encouraging: "Bahut accha sawaal!" "Sahi soch rahe ho!"
- Keep answers SHORT: 2-3 sentences max
- Point to specific things: "Ye part dekho — ye mitochondria hai"
- Use analogies from daily life
- Never sound like ChatGPT or a textbook
- End with a follow-up question to keep them curious`,
      greeting_message: "Namaste! 🙏 Main tumhara science companion hoon. Aaj kya explore karna hai?",
      language_style: "hindi",
      knowledge_areas: [],
      research_papers: [],
      voice_id: "EXAVITQu4vr4xnSDxMaL",
      is_published: false,
    });
  };

  const saveAgent = async (agent: any) => {
    const slug = agent.slug || agent.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { ...agent, slug };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (agent.id) {
      await supabase.from("ai_agents").update(payload).eq("id", agent.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("ai_agents").insert({ ...payload, created_by: user?.id });
    }
    setEditing(null);
    loadAgents();
  };

  const deleteAgent = async (id: string) => {
    await supabase.from("ai_agents").delete().eq("id", id);
    loadAgents();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("ai_agents").update({ is_published: !current }).eq("id", id);
    loadAgents();
  };

  if (editing) {
    return <AgentEditor agent={editing} onSave={saveAgent} onCancel={() => setEditing(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-primary-custom">AI Agents</h1>
          <p className="text-[12px] text-tertiary-custom mt-0.5">Create personalized learning companions</p>
        </div>
        <button onClick={createNew} className="flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97]">
          <Plus size={15} strokeWidth={1.5} /> New Agent
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-card">
          <Bot size={36} strokeWidth={1} className="text-border mb-3" />
          <p className="text-[14px] text-secondary-custom">No AI agents yet</p>
          <button onClick={createNew} className="mt-4 flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-xl text-[13px] font-medium">
            <Sparkles size={14} /> Create Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold text-primary-custom truncate">{agent.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${agent.is_published ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {agent.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-[12px] text-secondary-custom mt-0.5 line-clamp-2">{agent.personality}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {(agent.knowledge_areas || []).slice(0, 3).map((area: string) => (
                    <span key={area} className="text-[10px] bg-background-secondary text-tertiary-custom px-2 py-0.5 rounded-full">{area}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => togglePublish(agent.id, agent.is_published)} className="p-1.5 hover:bg-background-secondary rounded-lg transition-colors">
                  {agent.is_published ? <EyeOff size={14} className="text-tertiary-custom" /> : <Eye size={14} className="text-accent" />}
                </button>
                <button onClick={() => setEditing(agent)} className="p-1.5 hover:bg-background-secondary rounded-lg transition-colors">
                  <ChevronRight size={14} className="text-tertiary-custom" />
                </button>
                <button onClick={() => deleteAgent(agent.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 size={14} className="text-tertiary-custom hover:text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentEditor({ agent, onSave, onCancel }: { agent: any; onSave: (a: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState(agent);
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [paperInput, setPaperInput] = useState("");

  const update = (key: string, val: any) => setForm((prev: any) => ({ ...prev, [key]: val }));

  const addKnowledge = () => {
    if (!knowledgeInput.trim()) return;
    update("knowledge_areas", [...(form.knowledge_areas || []), knowledgeInput.trim()]);
    setKnowledgeInput("");
  };

  const addPaper = () => {
    if (!paperInput.trim()) return;
    update("research_papers", [...(form.research_papers || []), paperInput.trim()]);
    setPaperInput("");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[20px] font-semibold text-primary-custom">{agent.id ? "Edit Agent" : "Create Agent"}</h1>
        <button onClick={onCancel} className="text-[13px] text-secondary-custom hover:text-primary-custom">Cancel</button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Agent Name" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Saathi (साथी)" />
          <Field label="Slug" value={form.slug} onChange={(v) => update("slug", v)} placeholder="auto-generated" helper="URL-friendly name" />
        </div>
        <Field label="Personality" value={form.personality} onChange={(v) => update("personality", v)} placeholder="warm, friendly guide..." />
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">System Prompt</label>
          <textarea value={form.system_prompt} onChange={(e) => update("system_prompt", e.target.value)} rows={8}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-[13px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-accent transition-colors resize-none" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Greeting Message</label>
          <textarea value={form.greeting_message} onChange={(e) => update("greeting_message", e.target.value)} rows={3}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-[13px] text-primary-custom focus:outline-none focus:border-accent transition-colors resize-none" />
        </div>
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Language Style</label>
          <select value={form.language_style} onChange={(e) => update("language_style", e.target.value)}
            className="w-full bg-card border border-border rounded-xl h-10 px-3 text-[13px] text-primary-custom focus:outline-none focus:border-accent">
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="mixed">Mixed English + Hindi</option>
          </select>
        </div>
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Knowledge Areas</label>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {(form.knowledge_areas || []).map((area: string, i: number) => (
              <span key={i} className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-full flex items-center gap-1">
                {area}
                <button onClick={() => update("knowledge_areas", form.knowledge_areas.filter((_: string, j: number) => j !== i))}><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={knowledgeInput} onChange={(e) => setKnowledgeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKnowledge())}
              placeholder="e.g. Biology, Physics..."
              className="flex-1 bg-card border border-border rounded-xl h-9 px-3 text-[12px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-accent" />
            <button onClick={addKnowledge} className="px-3 bg-background-secondary rounded-xl text-[12px] text-secondary-custom hover:text-primary-custom">Add</button>
          </div>
        </div>
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Research Papers / References</label>
          <div className="space-y-1 mb-2">
            {(form.research_papers || []).map((paper: string, i: number) => (
              <div key={i} className="text-[11px] bg-card border border-border px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-secondary-custom truncate">{paper}</span>
                <button onClick={() => update("research_papers", form.research_papers.filter((_: string, j: number) => j !== i))}><X size={10} className="text-tertiary-custom" /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={paperInput} onChange={(e) => setPaperInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPaper())}
              placeholder="Paste paper URL or title..."
              className="flex-1 bg-card border border-border rounded-xl h-9 px-3 text-[12px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-accent" />
            <button onClick={addPaper} className="px-3 bg-background-secondary rounded-xl text-[12px] text-secondary-custom hover:text-primary-custom">Add</button>
          </div>
        </div>
        <Field label="ElevenLabs Voice ID" value={form.voice_id || ""} onChange={(v) => update("voice_id", v)} placeholder="EXAVITQu4vr4xnSDxMaL" />
        <div className="flex gap-2.5 pt-3">
          <button onClick={() => onSave({ ...form, is_published: false })} disabled={!form.name || !form.system_prompt}
            className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-secondary-custom hover:bg-background-secondary disabled:opacity-40 flex items-center gap-1.5">
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => onSave({ ...form, is_published: true })} disabled={!form.name || !form.system_prompt}
            className="px-5 py-2.5 bg-accent text-accent-foreground rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97] disabled:opacity-40 flex items-center gap-1.5">
            <Sparkles size={14} /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MODELS TABLE ──
function ModelsTable() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadModels(); }, []);
  const loadModels = async () => {
    const { data } = await supabase.from("models").select("*").order("created_at", { ascending: false });
    setModels(data || []);
    setLoading(false);
  };
  const deleteModel = async (id: string) => {
    await supabase.from("models").delete().eq("id", id);
    setModels(models.filter((m) => m.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-semibold text-primary-custom">Models</h1>
          <p className="text-[12px] text-tertiary-custom mt-0.5">{models.length} models in database</p>
        </div>
        <button onClick={() => navigate("/admin/upload")} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97]">
          <Plus size={15} strokeWidth={1.5} /> Upload
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-card">
          <Database size={32} strokeWidth={1} className="text-border mb-3" />
          <p className="text-[14px] text-secondary-custom">No models uploaded yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary">
                  {["Name", "Subject", "Tier", "Viral", "Status", ""].map((h) => (
                    <th key={h} className="label-text text-tertiary-custom text-left px-4 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-t border-border hover:bg-background-secondary/50 transition-colors h-12">
                    <td className="px-4 text-[13px] font-medium text-primary-custom">{m.name}</td>
                    <td className="px-4"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${subjectColors[m.subject] || "bg-muted text-secondary-custom"}`}>{m.subject}</span></td>
                    <td className="px-4 text-[12px] text-secondary-custom">T{m.tier}</td>
                    <td className="px-4 text-[12px] text-secondary-custom">{m.viral_score}</td>
                    <td className="px-4"><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${m.status === "published" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{m.status}</span></td>
                    <td className="px-4"><button onClick={() => deleteModel(m.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X size={14} strokeWidth={1.5} className="text-tertiary-custom hover:text-destructive" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UPLOAD VIEW ──
function UploadView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "biology", tier: 2, viral_score: 50, keywords_en: "", keywords_hi: "", named_parts: "", source: "", license: "CC0" });

  const handleUpload = async (status: "draft" | "published") => {
    if (!file || !form.name.trim()) return;
    setUploading(true);
    const slug = form.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const ext = file.name.split(".").pop() || "glb";
    const path = `${slug}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("models").upload(path, file, { upsert: true });
    if (uploadError) { alert("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("models").getPublicUrl(path);
    const { error: insertError } = await supabase.from("models").insert({
      name: form.name, slug, subject: form.subject, tier: form.tier, viral_score: form.viral_score,
      file_url: publicUrl, file_format: ext, file_size_bytes: file.size,
      keywords_en: form.keywords_en.split(",").map((k) => k.trim()).filter(Boolean),
      keywords_hi: form.keywords_hi.split(",").map((k) => k.trim()).filter(Boolean),
      named_parts: form.named_parts.split(",").map((k) => k.trim()).filter(Boolean),
      source: form.source || null, license: form.license || null, status, uploaded_by: user?.id,
    });
    if (insertError) { alert("Save failed: " + insertError.message); } else { navigate("/admin"); }
    setUploading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-[20px] font-semibold text-primary-custom mb-5">Upload Model</h1>
      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${file ? "border-accent bg-accent-subtle" : "border-border hover:border-accent"}`}>
        <input type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file ? (<><Check size={28} strokeWidth={1.5} className="text-accent mb-2" /><p className="text-[13px] font-medium text-primary-custom">{file.name}</p><p className="text-[11px] text-tertiary-custom mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p></>) : (<><CloudUpload size={28} strokeWidth={1.5} className="text-tertiary-custom mb-2" /><p className="text-[13px] text-secondary-custom">Drop 3D model or click to browse</p></>)}
      </label>
      <div className="mt-6 space-y-4">
        <Field label="Model Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Human Heart" />
        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Subject</label>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full bg-card border border-border rounded-xl h-10 px-3 text-[13px] text-primary-custom focus:outline-none focus:border-primary">
            {["biology", "physics", "chemistry", "mathematics", "geography", "astronomy", "engineering", "vehicles"].map((s) => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tier (1-3)" value={String(form.tier)} onChange={(v) => setForm({ ...form, tier: Number(v) || 2 })} type="number" />
          <Field label="Viral Score" value={String(form.viral_score)} onChange={(v) => setForm({ ...form, viral_score: Number(v) || 50 })} type="number" />
        </div>
        <Field label="English Keywords" value={form.keywords_en} onChange={(v) => setForm({ ...form, keywords_en: v })} placeholder="heart, cardiac" helper="Comma-separated" />
        <Field label="Hindi Keywords" value={form.keywords_hi} onChange={(v) => setForm({ ...form, keywords_hi: v })} placeholder="हृदय, दिल" />
        <Field label="Named Parts" value={form.named_parts} onChange={(v) => setForm({ ...form, named_parts: v })} placeholder="left_ventricle, aorta" helper="Must match mesh names" />
        <Field label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="NIH, Sketchfab" />
        <div className="flex gap-2.5 pt-3">
          <button onClick={() => handleUpload("draft")} disabled={uploading || !file || !form.name} className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-secondary-custom hover:bg-background-secondary disabled:opacity-40">Save Draft</button>
          <button onClick={() => handleUpload("published")} disabled={uploading || !file || !form.name} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:opacity-90 active:scale-[0.97] disabled:opacity-40">{uploading ? "Uploading..." : "Publish"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; helper?: string; type?: string }) {
  return (
    <div>
      <label className="text-[12px] font-medium text-primary-custom block mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-card border border-border rounded-xl h-10 px-3 text-[13px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-primary transition-colors" />
      {helper && <p className="text-[11px] text-tertiary-custom mt-0.5">{helper}</p>}
    </div>
  );
}
