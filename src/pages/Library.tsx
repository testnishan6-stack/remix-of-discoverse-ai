import { useState, useEffect } from "react";
import { Search, Play, Trash2, BookOpen } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const subjects = ["All", "Biology", "Physics", "Chemistry", "Astronomy", "Engineering", "Mathematics"];

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

  useEffect(() => {
    if (!user) return;
    loadLibrary();
  }, [user]);

  const loadLibrary = async () => {
    const { data } = await supabase
      .from("user_library")
      .select("*, models(name, subject, slug, named_parts, file_url)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setItems((data as LibraryItem[]) || []);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from("user_library").delete().eq("id", id);
    setItems(items.filter((i) => i.id !== id));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[24px] font-semibold text-primary-custom">Library</h1>
            <p className="text-[13px] text-tertiary-custom mt-0.5">Your saved simulations</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary-custom" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-card border border-border rounded-xl h-9 pl-9 pr-3 text-[13px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-0.5 border-b border-border mb-5 overflow-x-auto scrollbar-none">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSubject(s)}
              className={`px-3.5 py-2 text-[13px] whitespace-nowrap border-b-2 transition-all duration-150 ${
                activeSubject === s
                  ? "border-accent text-accent font-medium"
                  : "border-transparent text-secondary-custom hover:text-primary-custom"
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
            <BookOpen size={32} strokeWidth={1} className="text-border mb-3" />
            <p className="text-[14px] text-secondary-custom">No simulations saved yet</p>
            <p className="text-[12px] text-tertiary-custom mt-1">Explore topics in Chat or Learn mode to save them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-250 overflow-hidden"
              >
                <div className="h-[160px] bg-canvas flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-border/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-border/60" />
                  </div>
                  <span className="absolute top-2.5 right-2.5 bg-card/90 text-[11px] text-secondary-custom px-2 py-0.5 rounded-full font-medium">
                    {item.models?.subject}
                  </span>
                </div>
                <div className="p-3.5">
                  <h3 className="text-[14px] font-semibold text-primary-custom">{item.models?.name}</h3>
                  <p className="text-[11px] text-tertiary-custom mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()} · Step {(item.last_step || 0) + 1}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-accent-foreground text-[12px] font-medium py-2 rounded-lg hover:opacity-90 transition-opacity">
                      <Play size={12} strokeWidth={1.5} /> Resume
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 border border-border rounded-lg text-tertiary-custom hover:text-destructive hover:border-destructive transition-colors"
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
