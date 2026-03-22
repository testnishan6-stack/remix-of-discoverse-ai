import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Link2, Copy, Check, LogOut, Shield, Save, Bot, Trash2, Edit3, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { shareUrl } from "@/lib/constants";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ display_name: "", username: "", bio: "" });
  const [stats, setStats] = useState({ simulations: 0, chats: 0 });
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);
  const [togglingAgent, setTogglingAgent] = useState<string | null>(null);
  const [agentTab, setAgentTab] = useState<"active" | "drafts">("active");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
    loadMyAgents();
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
    if (error) console.error("Load profile error:", error);
    if (data) {
      setProfile(data);
      setForm({ display_name: data.display_name || "", username: data.username || "", bio: data.bio || "" });
    } else {
      setForm({
        display_name: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "",
        username: "",
        bio: ""
      });
    }
    setLoading(false);
  };

  const loadStats = async () => {
    const { count: libCount } = await supabase.from("user_library").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
    setStats({ simulations: libCount || 0, chats: 0 });
  };

  const loadMyAgents = async () => {
    const { data } = await supabase.from("ai_agents").select("id, name, slug, is_published, knowledge_areas, personality, avatar_url").eq("created_by", user!.id);
    if (data) setMyAgents(data);
  };

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const { data } = await supabase.from("profiles").select("user_id").eq("username", username).maybeSingle();
    if (data && data.user_id !== user!.id) setUsernameStatus("taken");
    else setUsernameStatus("available");
  };

  useEffect(() => {
    const timeout = setTimeout(() => { if (form.username) checkUsername(form.username); }, 500);
    return () => clearTimeout(timeout);
  }, [form.username]);

  const saveProfile = async () => {
    if (!user) return;
    if (usernameStatus === "taken") { toast.error("Username already taken"); return; }
    setSaving(true);
    const username = form.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    const link = username ? shareUrl(`/u/${username}`) : null;
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id, display_name: form.display_name || null,
      username: username || null, bio: form.bio || null, share_url: link,
    }, { onConflict: "user_id" });
    if (error) {
      if (error.code === "23505") toast.error("Username already taken");
      else toast.error("Failed to save: " + error.message);
    } else { toast.success("Profile updated!"); await loadProfile(); }
    setSaving(false);
  };

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(shareUrl(path));
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAgentPublish = async (agentId: string, currentStatus: boolean) => {
    setTogglingAgent(agentId);
    const { error } = await supabase.from("ai_agents").update({ is_published: !currentStatus }).eq("id", agentId).eq("created_by", user!.id);
    if (error) toast.error("Failed to update");
    else { toast.success(!currentStatus ? "Agent published!" : "Agent unpublished"); loadMyAgents(); }
    setTogglingAgent(null);
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm("Delete this agent permanently?")) return;
    setDeletingAgent(agentId);
    const { error } = await supabase.from("ai_agents").delete().eq("id", agentId).eq("created_by", user!.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Agent deleted"); loadMyAgents(); }
    setDeletingAgent(null);
  };

  if (loading) {
    return (
      <MainLayout title="Profile">
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = form.display_name || user?.email?.split("@")[0] || "Explorer";
  const activeAgents = myAgents.filter(a => a.is_published);
  const draftAgents = myAgents.filter(a => !a.is_published);
  const shownAgents = agentTab === "active" ? activeAgents : draftAgents;

  return (
    <MainLayout title="Profile">
      <div className="p-5 md:p-8 overflow-y-auto h-full pb-20 md:pb-8 max-w-xl mx-auto">
        {/* Avatar & header */}
        <div className="flex flex-col items-center text-center mb-8">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover ring-4 ring-accent/20 mb-4" alt="" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 ring-4 ring-accent/10">
              <User size={36} strokeWidth={1.5} className="text-accent" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
          <div className="flex gap-2 mt-3">
            {isAdmin && (
              <button onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full font-semibold hover:bg-accent/20 transition-colors active:scale-[0.97]">
                <Shield size={12} /> Admin
              </button>
            )}
            {form.username && (
              <button onClick={() => copyLink(`/u/${form.username}`)}
                className="inline-flex items-center gap-1.5 text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-full font-medium hover:bg-border transition-colors active:scale-[0.97]">
                <Share2 size={12} /> Share Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { value: stats.simulations, label: "Simulations" },
            { value: myAgents.length, label: "My Agents" },
            { value: activeAgents.length, label: "Published" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center hover:border-accent/30 transition-colors">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* My Agents */}
        {myAgents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">My Agents</h3>
              <div className="flex rounded-full overflow-hidden border border-border h-8 bg-secondary">
                {(["active", "drafts"] as const).map((tab) => (
                  <button key={tab} onClick={() => setAgentTab(tab)}
                    className={`px-4 text-xs font-semibold transition-all ${agentTab === tab ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"}`}>
                    {tab === "active" ? `Live (${activeAgents.length})` : `Drafts (${draftAgents.length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              {shownAgents.map(agent => (
                <div key={agent.id} className="bg-card border border-border rounded-2xl p-4 animate-fade-in hover:border-accent/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Bot size={20} className="text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${agent.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"}`}>
                          {agent.is_published ? "live" : "draft"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.personality}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch checked={agent.is_published} onCheckedChange={() => toggleAgentPublish(agent.id, agent.is_published)}
                        disabled={togglingAgent === agent.id} className="scale-75" />
                      <span className="text-[10px] text-muted-foreground font-medium">{agent.is_published ? "Online" : "Offline"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {agent.is_published && (
                        <button onClick={() => copyLink(`/agent/${agent.slug}`)}
                          className="p-2 hover:bg-secondary rounded-xl transition-colors" title="Copy share link">
                          <ExternalLink size={13} className="text-muted-foreground" />
                        </button>
                      )}
                      <button onClick={() => navigate(`/create-agent?edit=${agent.id}`)}
                        className="p-2 hover:bg-secondary rounded-xl transition-colors" title="Edit">
                        <Edit3 size={13} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => deleteAgent(agent.id)} disabled={deletingAgent === agent.id}
                        className="p-2 hover:bg-destructive/10 rounded-xl transition-colors" title="Delete">
                        <Trash2 size={13} className={deletingAgent === agent.id ? "text-muted-foreground animate-spin" : "text-destructive/60"} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {shownAgents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No {agentTab === "active" ? "live" : "draft"} agents</p>
              )}
            </div>
          </div>
        )}

        {/* Edit form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Display Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full bg-card border border-border rounded-xl h-11 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">@</span>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                className={`w-full bg-card border rounded-xl h-11 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                  usernameStatus === "taken" ? "border-destructive focus:ring-destructive/30" : usernameStatus === "available" ? "border-emerald-500 focus:ring-emerald-500/30" : "border-border focus:ring-accent/30 focus:border-accent"
                }`} placeholder="username" />
              {usernameStatus === "checking" && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
              )}
              {usernameStatus === "available" && <Check size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />}
              {usernameStatus === "taken" && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-destructive text-xs font-bold">Taken</span>}
            </div>
            {usernameStatus === "taken" && <p className="text-xs text-destructive mt-1">This username is already taken</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
              className="w-full bg-card border border-border rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none" placeholder="A little about yourself..." />
          </div>

          {form.username && (
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Share Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary border border-border rounded-xl h-11 px-3.5 flex items-center">
                  <Link2 size={13} className="text-muted-foreground mr-2 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate font-mono">discoverseai.com/u/{form.username}</span>
                </div>
                <button onClick={() => copyLink(`/u/${form.username}`)}
                  className="w-11 h-11 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-secondary transition-colors shrink-0 active:scale-95">
                  {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              </div>
            </div>
          )}

          <button onClick={saveProfile} disabled={saving || usernameStatus === "taken"}
            className="w-full bg-accent text-accent-foreground h-11 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
            <Save size={14} />
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Account info */}
        <div className="border-t border-border pt-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Mail size={14} className="text-muted-foreground" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Email</p>
              <p className="text-sm text-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><User size={14} className="text-muted-foreground" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Member since</p>
              <p className="text-sm text-foreground">{new Date(user?.created_at || "").toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <button onClick={signOut}
          className="w-full mt-6 border border-border bg-card text-muted-foreground h-11 rounded-xl text-sm font-semibold hover:bg-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </MainLayout>
  );
}
