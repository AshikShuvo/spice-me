import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({
  isActive,
  className,
}: {
  isActive: boolean;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        isActive
          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border border-neutral-200 bg-neutral-100 text-neutral-600",
        className,
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
