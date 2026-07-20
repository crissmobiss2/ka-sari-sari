import { cn } from "@/lib/utils";

export function NexoflowFooter({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1 py-1.5 border-t border-border/40", className)}>
      <span className="text-[10px] text-muted-foreground/50">Powered by</span>
      <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400/60">⚡ NexoFlow</span>
      <span className="text-[10px] text-muted-foreground/30">·</span>
      <span className="text-[10px] text-muted-foreground/40">Pacific Nexus Global</span>
    </div>
  );
}
