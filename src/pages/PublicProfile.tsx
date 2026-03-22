import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Bot, MessageCircle, ExternalLink, ArrowLeft, Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface PublicProfile {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface PublicAgent {
  id: string;
  name: string;
  slug: string;
  personality: string;
  avatar_url: string | null;
  knowledge_areas: string[] | null;
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (username) loadPublicProfile(username);
  }, [username]);

  const loadPublicProfile = async (uname: string) => {
    setLoading(true);
    // Fetch profile
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("display_name, username, bio, avatar_url, created_at, user_id")
      .eq("username", uname)
      .maybeSingle();

    if (error || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Fetch published agents by this user
    const { data: agentData } = await supabase
      .from("ai_agents")
      .select("id, name, slug, personality, avatar_url, knowledge_areas")
      .eq("created_by", profileData.user_id)
      .eq("is_published", true);

    if (agentData) setAgents(agentData);
    setLoading(false);
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${username}`);
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAgentChat = (slug: string) => {
    if (!user) {
      toast.info("Sign up to chat with this agent");
      navigate(`/auth?redirect=/agent/${slug}`);
      return;
    }
    navigate(`/agent/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <User size={48} className="text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Profile not found</h1>
        <p className="text-sm text-muted-foreground text-center">The user @{username} doesn't exist yet.</p>
        <button onClick={() => navigate("/")}
          className="mt-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Go Home
        </button>
      </div>
    );
  }

  const displayName = profile?.display_name || username || "User";
  const memberSince = new Date(profile?.created_at || "").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">@{username}</span>
        <button onClick={copyProfileLink} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          {copied ? <Check size={18} className="text-accent" /> : <Share2 size={18} className="text-muted-foreground" />}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-8">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-24 h-24 rounded-full object-cover border-2 border-border mb-4" alt={displayName} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <User size={36} strokeWidth={1.5} className="text-accent" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">@{username}</p>
          {profile?.bio && (
            <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">{profile.bio}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>Member since {memberSince}</span>
            <span>•</span>
            <span>{agents.length} published agent{agents.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Published agents */}
        {agents.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Bot size={18} className="text-accent" />
              Published Agents
            </h2>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="bg-card border border-border rounded-2xl p-4 hover:border-accent/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Bot size={20} className="text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.personality}</p>
                      {agent.knowledge_areas && agent.knowledge_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.knowledge_areas.slice(0, 3).map((area, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">{area}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => handleAgentChat(agent.slug)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-accent text-accent-foreground rounded-xl text-xs font-medium hover:opacity-90 transition-opacity">
                      <MessageCircle size={13} />
                      Chat with Agent
                    </button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/agent/${agent.slug}`);
                      toast.success("Agent link copied!");
                    }}
                      className="h-9 w-9 flex items-center justify-center border border-border rounded-xl hover:bg-secondary transition-colors">
                      <ExternalLink size={13} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {agents.length === 0 && (
          <div className="text-center py-12">
            <Bot size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No published agents yet</p>
          </div>
        )}

        {/* CTA for non-logged-in users */}
        {!user && (
          <div className="mt-8 bg-card border border-border rounded-2xl p-5 text-center">
            <h3 className="text-sm font-semibold text-foreground mb-1">Want to collaborate?</h3>
            <p className="text-xs text-muted-foreground mb-4">Sign up to chat with agents, create your own, and collaborate with creators.</p>
            <button onClick={() => navigate("/auth")}
              className="px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Sign Up Free
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
