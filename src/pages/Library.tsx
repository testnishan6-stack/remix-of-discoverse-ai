import { useState, useEffect } from "react";
import { Search, Play, Trash2, BookOpen, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const subjects = ["All", "Biology", "Physics", "Chemistry", "Astronomy", "Engineering", "Mathematics", "Science"];

interface LibraryItem {
  id: string;
  model_id: string;
  last_step: number | null;
  created_at: string;
  models: {
    name: string;
    subject: string;
    slug: string;
    named_parts: string[] | null;
    file_url: string;
  } | null;
}

export default function Library() {
  const [activeSubject, setActiveSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadLibrary();
  }, [user]);

  const loadLibrary = async () => {
    try {
      const { data, error } = await supabase
        .from("user_library")
        .select("*, models(name, subject, slug, named_parts, file_url)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Library load error:", error);
        toast.error("Failed to load library");
      }
      setItems((data as LibraryItem[]) || []);
    } catch (err) {
      console.error("Library error:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("user_library").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove item");
      return;
    }
    setItems(items.filter((i) => i.id !== id));
    toast.success("Removed from library");
  };

  const filtered = items.filter((item) => {
    const model = item.models;
    if (!model) return false;
    const matchesSubject = activeSubject === "All" || model.subject.toLowerCase() === activeSubject.toLowerCase();
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <MainLayout title="Library">
      <div className="p-5 md:p-8 overflow-y-auto h-full pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Library</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your saved simulations</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search size={14} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-card border border-border rounded-xl h-10 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-none pb-1">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-full transition-all duration-150 ${
                activeSubject === s
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <BookOpen size={28} strokeWidth={1} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No simulations saved yet</p>
            <p className="text-xs text-muted-foreground mt-1">Explore topics in Chat or Learn mode to save them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl hover:shadow-lg hover:-translate-y-0.5 hover:border-accent/20 transition-all duration-250 overflow-hidden group"
              >
                <div className="h-[160px] bg-gradient-to-br from-accent/5 to-secondary flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-accent/20" />
                  </div>
                  <span className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-[10px] text-muted-foreground px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
                    {item.models?.subject}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{item.models?.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(item.created_at).toLocaleDateString()} · Step {(item.last_step || 0) + 1}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate("/app")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-accent-foreground text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity active:scale-[0.97] shadow-sm"
                    >
                      <Play size={13} strokeWidth={1.5} /> Resume
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors active:scale-95"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
