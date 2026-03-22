import { MainLayout } from "@/components/MainLayout";
import { ChatView } from "@/components/ChatView";
import { LearnView } from "@/components/LearnView";
import { useApp } from "@/contexts/AppContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const { mode } = useApp();
  const { maintenanceMode, maintenanceMessage, loading } = usePlatformSettings();

  if (loading) {
    return (
      <MainLayout title="Loading">
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (maintenanceMode) {
    return (
      <MainLayout title="Maintenance">
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Under Maintenance</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{maintenanceMessage}</p>
          <p className="text-xs text-muted-foreground mt-4">We'll be back soon. Thank you for your patience!</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={mode === "chat" ? "Agents" : "Learn"}>
      <div className="h-full transition-opacity duration-300" key={mode}>
        {mode === "chat" ? <ChatView /> : <LearnView />}
      </div>
    </MainLayout>
  );
};

export default Index;
