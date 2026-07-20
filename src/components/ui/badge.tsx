import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground border-brand-200 dark:border-brand-500/30",
        success:   "bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-foreground border-success-500/25",
        warning:   "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground border-warning-500/25",
        danger:    "bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-foreground border-danger-500/25",
        info:      "bg-info-50 dark:bg-info-500/10 text-info-600 dark:text-foreground border-info-500/25 dark:border-info-500/30",
        neutral:   "bg-surface-100 dark:bg-surface-800 text-surface-600 border-surface-200",
        outline:   "border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
