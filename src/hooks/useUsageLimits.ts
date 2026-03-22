import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_CHATS_PER_DAY = 3;
const FREE_MODELS_PER_DAY = 3;

interface UsageLimits {
  chatCount: number;
  modelGenCount: number;
  canChat: boolean;
  canGenerateModel: boolean;
  chatsRemaining: number;
  modelsRemaining: number;
  incrementChat: () => Promise<boolean>;
  incrementModelGen: () => Promise<boolean>;
  loading: boolean;
}

export function useUsageLimits(): UsageLimits {
  const { user } = useAuth();
  const [chatCount, setChatCount] = useState(0);
  const [modelGenCount, setModelGenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchUsage = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("daily_usage")
      .select("chat_count, model_gen_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();
    setChatCount(data?.chat_count ?? 0);
    setModelGenCount(data?.model_gen_count ?? 0);
    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const incrementChat = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (chatCount >= FREE_CHATS_PER_DAY) return false;
    const newCount = chatCount + 1;
    const { error } = await supabase
      .from("daily_usage")
      .upsert(
        { user_id: user.id, usage_date: today, chat_count: newCount },
        { onConflict: "user_id,usage_date" }
      );
    if (!error) setChatCount(newCount);
    return !error;
  }, [user, chatCount, today]);

  const incrementModelGen = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (modelGenCount >= FREE_MODELS_PER_DAY) return false;
    const newCount = modelGenCount + 1;
    const { error } = await supabase
      .from("daily_usage")
      .upsert(
        { user_id: user.id, usage_date: today, model_gen_count: newCount },
        { onConflict: "user_id,usage_date" }
      );
    if (!error) setModelGenCount(newCount);
    return !error;
  }, [user, modelGenCount, today]);

  return {
    chatCount,
    modelGenCount,
    canChat: chatCount < FREE_CHATS_PER_DAY,
    canGenerateModel: modelGenCount < FREE_MODELS_PER_DAY,
    chatsRemaining: Math.max(0, FREE_CHATS_PER_DAY - chatCount),
    modelsRemaining: Math.max(0, FREE_MODELS_PER_DAY - modelGenCount),
    incrementChat,
    incrementModelGen,
    loading,
  };
}
