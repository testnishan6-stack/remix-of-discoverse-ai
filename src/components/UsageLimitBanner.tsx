import { AlertTriangle, Crown } from "lucide-react";

interface Props {
  type: "chat" | "model";
  remaining: number;
  total: number;
}

export function UsageLimitBanner({ type, remaining, total }: Props) {
  if (remaining > 0) return null;

  return (
    <div className="mx-4 my-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Daily {type === "chat" ? "chat" : "3D generation"} limit reached
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
          You've used all {total} free {type === "chat" ? "chats" : "3D generations"} for today. Upgrade to Pro for unlimited access.
        </p>
        <a
          href="mailto:geetxteam@gmail.com?subject=Upgrade to Pro - Discoverse AI"
          className="inline-flex items-center gap-1.5 mt-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-amber-700 active:scale-[0.97] transition-all"
        >
          <Crown size={12} /> Contact Admin to Upgrade
        </a>
      </div>
    </div>
  );
}

export function UsageCounter({ remaining, total, type }: Props) {
  if (remaining <= 0) return null;
  return (
    <span className="text-[10px] text-muted-foreground font-medium">
      {remaining}/{total} {type === "chat" ? "chats" : "generations"} left today
    </span>
  );
}
