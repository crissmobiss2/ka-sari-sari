import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-brand-50 text-brand-700 border-brand-200",
        success:   "bg-success-50 text-success-700 border-success-500/25",
        warning:   "bg-warning-50 text-warning-600 border-warning-500/25",
        danger:    "bg-danger-50 text-danger-600 border-danger-500/25",
        info:      "bg-info-50 text-info-600 border-info-500/25",
        neutral:   "bg-surface-100 text-surface-600 border-surface-200",
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
