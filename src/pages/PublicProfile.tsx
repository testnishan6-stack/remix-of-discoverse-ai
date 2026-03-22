import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { User, Bot, MessageCircle, ExternalLink, ArrowLeft, Share2, Check, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import { shareUrl } from "@/lib/constants";

interface PublicProfile {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  user_id: string;
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
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("display_name, username, bio, avatar_url, created_at, user_id")
      .eq("username", uname)
      .maybeSingle();

    if (error || !profileData) { setNotFound(true); setLoading(false); return; }
    setProfile(profileData);

    const { data: agentData } = await supabase
      .from("ai_agents")
      .select("id, name, slug, personality, avatar_url, knowledge_areas")
      .eq("created_by", profileData.user_id)
      .eq("is_published", true);

    if (agentData) setAgents(agentData);
    setLoading(false);
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(shareUrl(`/u/${username}`));
    setCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAgentLink = (slug: string) => {
    navigator.clipboard.writeText(shareUrl(`/agent/${slug}`));
    toast.success("Agent link copied!");
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
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <User size={36} className="text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Profile not found</h1>
        <p className="text-sm text-muted-foreground text-center">@{username} doesn't exist yet.</p>
        <button onClick={() => navigate("/")}
          className="mt-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]">
          Go Home
        </button>
      </div>
    );
  }

  const displayName = profile?.display_name || username || "User";
  const memberSince = new Date(profile?.created_at || "").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header with gradient */}
      <div className="bg-gradient-to-b from-accent/5 to-background border-b border-border">
        <div className="sticky top-0 z-10 bg-transparent px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">@{username}</span>
          <button onClick={copyProfileLink} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            {copied ? <Check size={18} className="text-accent" /> : <Share2 size={18} className="text-muted-foreground" />}
          </button>
        </div>

        <div className="max-w-lg mx-auto px-5 pb-8 pt-2">
          <div className="flex flex-col items-center text-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-28 h-28 rounded-full object-cover ring-4 ring-accent/20 mb-4" alt={displayName} />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 ring-4 ring-accent/10">
                <User size={44} strokeWidth={1.5} className="text-accent" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{displayName}</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">@{username}</p>
            {profile?.bio && (
              <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar size={12} />{memberSince}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1"><Zap size={12} />{agents.length} agent{agents.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Published agents */}
        {agents.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Bot size={18} className="text-accent" />
              Published Agents
            </h2>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="bg-card border border-border rounded-2xl p-4 hover:border-accent/30 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center shrink-0 overflow-hidden">
                      {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Bot size={24} className="text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{agent.personality}</p>
                      {agent.knowledge_areas && agent.knowledge_areas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.knowledge_areas.slice(0, 3).map((area, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded-full font-medium">{area}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button onClick={() => handleAgentChat(agent.slug)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-accent text-accent-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity active:scale-[0.97] shadow-sm">
                      <MessageCircle size={14} />
                      Chat with Agent
                    </button>
                    <button onClick={() => copyAgentLink(agent.slug)}
                      className="h-10 w-10 flex items-center justify-center border border-border rounded-xl hover:bg-secondary transition-colors active:scale-95">
                      <ExternalLink size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {agents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Bot size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No published agents yet</p>
          </div>
        )}

        {/* CTA for non-logged-in users */}
        {!user && (
          <div className="mt-8 bg-gradient-to-br from-accent/5 to-card border border-accent/20 rounded-2xl p-6 text-center">
            <h3 className="text-sm font-bold text-foreground mb-1">Want to collaborate?</h3>
            <p className="text-xs text-muted-foreground mb-4">Sign up to chat with agents, create your own, and collaborate with creators.</p>
            <button onClick={() => navigate("/auth")}
              className="px-6 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97] shadow-sm">
              Sign Up Free
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
