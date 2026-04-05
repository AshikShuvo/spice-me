import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-coal-20 bg-white px-6 py-16 text-center">
      <p className="text-body font-medium text-coal">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-body text-neutral-30">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
