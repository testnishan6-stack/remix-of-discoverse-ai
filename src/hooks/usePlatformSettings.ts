import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function usePlatformSettings(): PlatformSettings {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    if (data?.value) {
      const val = data.value as { enabled?: boolean; message?: string };
      setMaintenanceMode(!!val.enabled);
      setMaintenanceMessage(val.message || "Platform is under maintenance.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { maintenanceMode, maintenanceMessage, loading, refresh };
}
