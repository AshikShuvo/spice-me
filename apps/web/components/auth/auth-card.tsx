import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md space-y-4 rounded-lg border border-neutral-20 bg-light-bg p-6 text-coal shadow-sm">
      <div className="space-y-1">
        <h2 className="text-title font-ringside-compressed text-coal">{title}</h2>
        {description ? (
          <p className="text-body text-neutral-30">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
