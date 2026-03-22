import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Bot, X, Save, Sparkles, ArrowLeft, Camera, Image, FileText, Presentation, Globe, Youtube, Lock, Send, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const TOOL_OPTIONS = [
  { key: "image_generation", label: "Image Generation", icon: Image, desc: "Generate AI images" },
  { key: "pdf_maker", label: "PDF Maker", icon: FileText, desc: "Create PDF documents" },
  { key: "pptx_maker", label: "Slides / PPTX", icon: Presentation, desc: "Create presentations" },
  { key: "web_search", label: "Web Search", icon: Globe, desc: "Search the internet" },
  { key: "youtube_summary", label: "YouTube Summary", icon: Youtube, desc: "Summarize YouTube videos" },
] as const;

const IMAGE_STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "illustration", label: "Illustration" },
  { value: "anime", label: "Anime / Manga" },
  { value: "3d_render", label: "3D Render" },
  { value: "watercolor", label: "Watercolor" },
];

const DEFAULT_FORM = {
  name: "", slug: "",
  personality: "warm, friendly guide who explains things like a close friend",
  system_prompt: `You are a warm, experienced learning companion. Your style:
- Talk like a close friend, not a teacher
- Use simple language mixed with relevant technical terms
- Be encouraging and supportive
- Keep answers SHORT: 2-3 sentences max
- Use analogies from daily life
- Never sound like a generic chatbot
- End with a follow-up question to keep them curious`,
  greeting_message: "Hey! 👋 I'm here to help you learn. What topic are you curious about today?",
  language_style: "mixed",
  knowledge_areas: [] as string[],
  research_papers: [] as string[],
  voice_id: "EXAVITQu4vr4xnSDxMaL",
  tools_enabled: { image_generation: false, pdf_maker: false, pptx_maker: false, web_search: false, youtube_summary: false } as Record<string, boolean>,
  image_gen_style: "photorealistic",
};

export default function CreateAgent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [paperInput, setPaperInput] = useState("");

  // Access control
  const [accessStatus, setAccessStatus] = useState<"loading" | "granted" | "pending" | "denied">("loading");
  const [applicationForm, setApplicationForm] = useState({ full_name: "", reason: "", portfolio_url: "" });
  const [submittingApp, setSubmittingApp] = useState(false);

  // Check if user has agent creation access
  useEffect(() => {
    if (!user) return;
    if (editId) { setAccessStatus("granted"); return; } // editing own agent is always ok
    
    const checkAccess = async () => {
      // Admins always have access
      if (isAdmin) { setAccessStatus("granted"); return; }

      // Check if user already has agents (grandfathered)
      const { data: existingAgents } = await supabase
        .from("ai_agents").select("id").eq("created_by", user.id).limit(1);
      if (existingAgents && existingAgents.length > 0) { setAccessStatus("granted"); return; }

      // Check application status
      const { data: application } = await supabase
        .from("agent_creator_applications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application?.status === "approved") { setAccessStatus("granted"); return; }
      if (application?.status === "pending") { setAccessStatus("pending"); return; }
      setAccessStatus("denied");
    };
    checkAccess();
  }, [user, isAdmin, editId]);

  const submitApplication = async () => {
    if (!applicationForm.full_name || !applicationForm.reason) { toast.error("Please fill required fields"); return; }
    setSubmittingApp(true);
    const { error } = await supabase.from("agent_creator_applications").insert({
      user_id: user!.id,
      full_name: applicationForm.full_name,
      reason: applicationForm.reason,
      portfolio_url: applicationForm.portfolio_url || null,
    });
    setSubmittingApp(false);
    if (error) { toast.error("Failed to submit application"); return; }
    toast.success("Application submitted! We'll review it soon.");
    setAccessStatus("pending");
  };

  // Load existing agent for editing
  useEffect(() => {
    if (!editId || !user) return;
    const load = async () => {
      const { data } = await supabase.from("ai_agents").select("*").eq("id", editId).eq("created_by", user.id).maybeSingle();
      if (data) {
        const tools = (data.tools_enabled as Record<string, boolean>) || DEFAULT_FORM.tools_enabled;
        setForm({ name: data.name || "", slug: data.slug || "", personality: data.personality || "", system_prompt: data.system_prompt || "", greeting_message: data.greeting_message || "", language_style: data.language_style || "mixed", knowledge_areas: data.knowledge_areas || [], research_papers: data.research_papers || [], voice_id: data.voice_id || "", tools_enabled: { ...DEFAULT_FORM.tools_enabled, ...tools }, image_gen_style: data.image_gen_style || "photorealistic" });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      } else { toast.error("Agent not found"); navigate("/profile"); }
      setLoadingEdit(false);
    };
    load();
  }, [editId, user]);

  const update = (key: string, val: any) => setForm((prev) => ({ ...prev, [key]: val }));
  const toggleTool = (toolKey: string) => setForm((prev) => ({ ...prev, tools_enabled: { ...prev.tools_enabled, [toolKey]: !prev.tools_enabled[toolKey] } }));

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const addKnowledge = () => { if (!knowledgeInput.trim()) return; update("knowledge_areas", [...form.knowledge_areas, knowledgeInput.trim()]); setKnowledgeInput(""); };
  const addPaper = () => { if (!paperInput.trim()) return; update("research_papers", [...form.research_papers, paperInput.trim()]); setPaperInput(""); };

  const handleSave = async (publish: boolean) => {
    if (!form.name.trim() || !form.system_prompt.trim() || !user) return;
    setSaving(true);
    let avatarUrl: string | null = avatarPreview?.startsWith("http") ? avatarPreview : null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() || "png";
      const path = `agents/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, avatarFile);
      if (!uploadErr) { const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path); avatarUrl = urlData.publicUrl; }
    }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const payload = { name: form.name, slug, personality: form.personality, system_prompt: form.system_prompt, greeting_message: form.greeting_message, language_style: form.language_style, knowledge_areas: form.knowledge_areas, research_papers: form.research_papers, voice_id: form.voice_id || null, is_published: publish, avatar_url: avatarUrl, tools_enabled: form.tools_enabled as any, image_gen_style: form.image_gen_style };
    let error;
    if (editId) { ({ error } = await supabase.from("ai_agents").update(payload).eq("id", editId).eq("created_by", user.id)); }
    else { ({ error } = await supabase.from("ai_agents").insert({ ...payload, created_by: user.id })); }
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success(editId ? "Agent updated!" : publish ? "Agent published!" : "Draft saved!");
    navigate("/profile");
  };

  if (loadingEdit || accessStatus === "loading") {
    return (
      <MainLayout title="Create Agent">
        <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
      </MainLayout>
    );
  }

  // Application form for non-licensed users
  if (accessStatus === "denied") {
    return (
      <MainLayout title="Apply for Creator Access">
        <div className="h-full overflow-y-auto pb-20 md:pb-8">
          <div className="max-w-md mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-accent" />
              </div>
              <h1 className="text-xl font-black text-foreground mb-2">Creator Access Required</h1>
              <p className="text-sm text-muted-foreground">Agent creation is available to approved creators. Apply below and our team will review your application.</p>
            </div>
            <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Full Name *</label>
                <input value={applicationForm.full_name} onChange={(e) => setApplicationForm({...applicationForm, full_name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Why do you want to create agents? *</label>
                <textarea value={applicationForm.reason} onChange={(e) => setApplicationForm({...applicationForm, reason: e.target.value})} rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none" placeholder="Tell us about your expertise and what kind of agents you'd create..." />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Portfolio / Website (optional)</label>
                <input value={applicationForm.portfolio_url} onChange={(e) => setApplicationForm({...applicationForm, portfolio_url: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" placeholder="https://your-portfolio.com" />
              </div>
              <button onClick={submitApplication} disabled={submittingApp}
                className="w-full bg-accent text-accent-foreground h-12 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
                <Send size={14} /> {submittingApp ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (accessStatus === "pending") {
    return (
      <MainLayout title="Application Pending">
        <div className="h-full flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-yellow-600" />
            </div>
            <h1 className="text-xl font-black text-foreground mb-2">Application Under Review</h1>
            <p className="text-sm text-muted-foreground mb-6">Your creator application is being reviewed by our team. We'll notify you once approved. This usually takes 1-2 business days.</p>
            <button onClick={() => navigate("/app")} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all">
              Back to App
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── Agent Creation Form (granted access) ──
  return (
    <MainLayout title={editId ? "Edit Agent" : "Create Agent"}>
      <div className="h-full overflow-y-auto pb-20 md:pb-8">
        <div className="max-w-xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 font-medium">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0 overflow-hidden border-2 border-dashed border-border hover:border-accent transition-colors relative group">
              {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={22} className="text-accent" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"><Camera size={14} className="text-white" /></div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            <div>
              <h1 className="text-lg font-black text-foreground">{editId ? "Edit Agent" : "Create Your Agent"}</h1>
              <p className="text-xs text-muted-foreground">Build a specialized AI with personality & tools</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Agent Name" value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Physics Pro, Math Buddy" />
            <Field label="Personality" value={form.personality} onChange={(v) => update("personality", v)} placeholder="warm, friendly guide who..." />
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">System Prompt</label>
              <textarea value={form.system_prompt} onChange={(e) => update("system_prompt", e.target.value)} rows={5}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none" placeholder="Define the agent's behavior..." />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Greeting Message</label>
              <textarea value={form.greeting_message} onChange={(e) => update("greeting_message", e.target.value)} rows={2}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none" />
            </div>

            {/* Tools */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">Agent Tools & Capabilities</label>
              <div className="space-y-2">
                {TOOL_OPTIONS.map(({ key, label, icon: Icon, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:border-accent/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Icon size={16} className="text-accent" /></div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Switch checked={form.tools_enabled[key] || false} onCheckedChange={() => toggleTool(key)} className="scale-75" />
                  </div>
                ))}
              </div>
            </div>

            {form.tools_enabled.image_generation && (
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Image Style</label>
                <select value={form.image_gen_style} onChange={(e) => update("image_gen_style", e.target.value)}
                  className="w-full bg-card border border-border rounded-xl h-11 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                  {IMAGE_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Language Style</label>
              <select value={form.language_style} onChange={(e) => update("language_style", e.target.value)}
                className="w-full bg-card border border-border rounded-xl h-11 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent">
                <option value="mixed">Mixed English + Romanized Nepali</option>
                <option value="romanized_nepali">Romanized Nepali</option>
                <option value="english">English</option>
                <option value="hindi">Hindi (Devanagari)</option>
              </select>
            </div>

            {/* Knowledge areas */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Knowledge Areas</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {form.knowledge_areas.map((area, i) => (
                  <span key={i} className="text-[11px] bg-accent/10 text-accent px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
                    {area} <button onClick={() => update("knowledge_areas", form.knowledge_areas.filter((_, j) => j !== i))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={knowledgeInput} onChange={(e) => setKnowledgeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKnowledge())}
                  placeholder="e.g. Biology, Physics..." className="flex-1 bg-card border border-border rounded-xl h-10 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
                <button onClick={addKnowledge} className="px-4 bg-secondary rounded-xl text-xs text-muted-foreground hover:text-foreground font-semibold">Add</button>
              </div>
            </div>

            {/* References */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">References (URLs, Papers, YouTube)</label>
              <div className="space-y-1 mb-2">
                {form.research_papers.map((paper, i) => (
                  <div key={i} className="text-[11px] bg-card border border-border px-3 py-1.5 rounded-lg flex items-center justify-between">
                    <span className="text-muted-foreground truncate">{paper}</span>
                    <button onClick={() => update("research_papers", form.research_papers.filter((_, j) => j !== i))}><X size={10} className="text-muted-foreground" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={paperInput} onChange={(e) => setPaperInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPaper())}
                  placeholder="Paste URL, paper title, YouTube link..." className="flex-1 bg-card border border-border rounded-xl h-10 px-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
                <button onClick={addPaper} className="px-4 bg-secondary rounded-xl text-xs text-muted-foreground hover:text-foreground font-semibold">Add</button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 pb-6">
              <button onClick={() => handleSave(false)} disabled={!form.name || !form.system_prompt || saving}
                className="flex-1 px-5 py-3 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.97] transition-all">
                <Save size={14} /> Save Draft
              </button>
              <button onClick={() => handleSave(true)} disabled={!form.name || !form.system_prompt || saving}
                className="flex-1 px-5 py-3 bg-accent text-accent-foreground rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all">
                <Sparkles size={14} /> {saving ? "Saving..." : editId ? "Update & Publish" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-foreground block mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-card border border-border rounded-xl h-11 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
    </div>
  );
}
