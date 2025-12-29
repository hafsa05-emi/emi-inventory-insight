import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  delay = 0,
}: KPICardProps) {
  const variants = {
    default: "bg-card border-border",
    primary: "bg-primary/10 border-primary/30",
    success: "bg-chart-success/10 border-chart-success/30",
    warning: "bg-chart-warning/10 border-chart-warning/30",
  };

  const iconVariants = {
    default: "bg-secondary text-foreground",
    primary: "bg-primary/20 text-primary",
    success: "bg-chart-success/20 text-chart-success",
    warning: "bg-chart-warning/20 text-chart-warning",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-card animate-slide-up",
        variants[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            iconVariants[variant]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
