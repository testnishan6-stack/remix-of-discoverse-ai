import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Database, Upload, BarChart3, Layers, Plus, MoreHorizontal, CloudUpload, Check, X, AlertTriangle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const adminNav = [
  { icon: Database, label: "Models", path: "/admin" },
  { icon: Upload, label: "Upload", path: "/admin/upload" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Layers, label: "Cache", path: "/admin/cache" },
];

const subjectColors: Record<string, string> = {
  biology: "bg-green-50 text-green-700",
  physics: "bg-blue-50 text-blue-700",
  chemistry: "bg-purple-50 text-purple-700",
  astronomy: "bg-indigo-50 text-indigo-700",
  engineering: "bg-orange-50 text-orange-700",
  mathematics: "bg-pink-50 text-pink-700",
};

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

  return (
    <MainLayout title="Admin Panel">
      <div className="flex h-full">
        <div className="hidden md:block w-44 bg-background-secondary border-r border-border p-2.5 space-y-0.5">
          <p className="label-text text-tertiary-custom px-3 py-2">Admin</p>
          {adminNav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                location.pathname === item.path
                  ? "bg-accent-subtle text-accent font-medium"
                  : "text-secondary-custom hover:bg-border-subtle"
              }`}
            >
              <item.icon size={15} strokeWidth={1.5} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-8 pb-20 md:pb-8">
          {location.pathname === "/admin/upload" ? <UploadView /> : <ModelsTable />}
        </div>
      </div>
    </MainLayout>
  );
}

function ModelsTable() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
  }, []);

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
        <button
          onClick={() => navigate("/admin/upload")}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity active:scale-[0.97]"
        >
          <Plus size={15} strokeWidth={1.5} /> Upload
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-xl bg-card">
          <Database size={32} strokeWidth={1} className="text-border mb-3" />
          <p className="text-[14px] text-secondary-custom">No models uploaded yet</p>
          <p className="text-[12px] text-tertiary-custom mt-1">Upload your first 3D model to get started</p>
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
                    <td className="px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${subjectColors[m.subject] || "bg-muted text-secondary-custom"}`}>
                        {m.subject}
                      </span>
                    </td>
                    <td className="px-4 text-[12px] text-secondary-custom">T{m.tier}</td>
                    <td className="px-4 text-[12px] text-secondary-custom">{m.viral_score}</td>
                    <td className="px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        m.status === "published" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4">
                      <button
                        onClick={() => deleteModel(m.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <X size={14} strokeWidth={1.5} className="text-tertiary-custom hover:text-destructive" />
                      </button>
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

function UploadView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", subject: "biology", tier: 2, viral_score: 50,
    keywords_en: "", keywords_hi: "", named_parts: "",
    source: "", license: "CC0",
  });

  const handleUpload = async (status: "draft" | "published") => {
    if (!file || !form.name.trim()) return;
    setUploading(true);

    const slug = form.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const ext = file.name.split(".").pop() || "glb";
    const path = `${slug}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("models").upload(path, file, { upsert: true });
    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("models").getPublicUrl(path);

    const { error: insertError } = await supabase.from("models").insert({
      name: form.name,
      slug,
      subject: form.subject,
      tier: form.tier,
      viral_score: form.viral_score,
      file_url: publicUrl,
      file_format: ext,
      file_size_bytes: file.size,
      keywords_en: form.keywords_en.split(",").map((k) => k.trim()).filter(Boolean),
      keywords_hi: form.keywords_hi.split(",").map((k) => k.trim()).filter(Boolean),
      named_parts: form.named_parts.split(",").map((k) => k.trim()).filter(Boolean),
      source: form.source || null,
      license: form.license || null,
      status,
      uploaded_by: user?.id,
    });

    if (insertError) {
      alert("Save failed: " + insertError.message);
    } else {
      navigate("/admin");
    }
    setUploading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-[20px] font-semibold text-primary-custom mb-5">Upload Model</h1>

      {/* Drop zone */}
      <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors duration-150 ${
        file ? "border-accent bg-accent-subtle" : "border-border hover:border-accent"
      }`}>
        <input type="file" accept=".glb,.gltf,.fbx,.obj" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file ? (
          <>
            <Check size={28} strokeWidth={1.5} className="text-accent mb-2" />
            <p className="text-[13px] font-medium text-primary-custom">{file.name}</p>
            <p className="text-[11px] text-tertiary-custom mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </>
        ) : (
          <>
            <CloudUpload size={28} strokeWidth={1.5} className="text-tertiary-custom mb-2" />
            <p className="text-[13px] text-secondary-custom">Drop 3D model or click to browse</p>
            <p className="text-[11px] text-tertiary-custom mt-0.5">GLB, GLTF, FBX, OBJ — Max 50MB</p>
          </>
        )}
      </label>

      <div className="mt-6 space-y-4">
        <Field label="Model Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Human Heart" />

        <div>
          <label className="text-[12px] font-medium text-primary-custom block mb-1">Subject</label>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full bg-card border border-border rounded-xl h-10 px-3 text-[13px] text-primary-custom focus:outline-none focus:border-primary transition-colors"
          >
            {["biology", "physics", "chemistry", "mathematics", "geography", "astronomy", "engineering", "vehicles"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tier (1-3)" value={String(form.tier)} onChange={(v) => setForm({ ...form, tier: Number(v) || 2 })} type="number" />
          <Field label="Viral Score" value={String(form.viral_score)} onChange={(v) => setForm({ ...form, viral_score: Number(v) || 50 })} type="number" />
        </div>

        <Field label="English Keywords" value={form.keywords_en} onChange={(v) => setForm({ ...form, keywords_en: v })} placeholder="heart, cardiac, ventricle" helper="Comma-separated" />
        <Field label="Hindi Keywords" value={form.keywords_hi} onChange={(v) => setForm({ ...form, keywords_hi: v })} placeholder="हृदय, दिल" />
        <Field label="Named Parts" value={form.named_parts} onChange={(v) => setForm({ ...form, named_parts: v })} placeholder="left_ventricle, aorta" helper="Must match mesh names in file" />
        <Field label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="NIH, Sketchfab, etc." />

        <div className="flex gap-2.5 pt-3">
          <button
            onClick={() => handleUpload("draft")}
            disabled={uploading || !file || !form.name}
            className="px-5 py-2.5 border border-border rounded-xl text-[13px] font-medium text-secondary-custom hover:bg-background-secondary transition-colors disabled:opacity-40"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleUpload("published")}
            disabled={uploading || !file || !form.name}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-40"
          >
            {uploading ? "Uploading..." : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, helper, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; helper?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-primary-custom block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-card border border-border rounded-xl h-10 px-3 text-[13px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-primary transition-colors"
      />
      {helper && <p className="text-[11px] text-tertiary-custom mt-0.5">{helper}</p>}
    </div>
  );
}
