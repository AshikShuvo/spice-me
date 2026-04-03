"use client";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DesignGuideUiShowcase() {
  return (
    <section className="space-y-12">
      <h2 className="text-title text-coal border-b border-coal-20 pb-4">
        shadcn/ui (CLI)
      </h2>
      <p className="text-body text-coal-60 -mt-6">
        Primitives are generated with{" "}
        <code className="bg-lyserosa px-1 rounded text-caption">
          bunx shadcn@latest add …
        </code>{" "}
        into <code className="bg-lyserosa px-1 rounded text-caption">components/ui</code>.
        Semantic colours come from{" "}
        <code className="bg-lyserosa px-1 rounded text-caption">app/shadcn-theme.css</code>{" "}
        (Peppes palette); global tweaks live in{" "}
        <code className="bg-lyserosa px-1 rounded text-caption">app/globals.css</code>.
      </p>

      {/* Buttons */}
      <div className="space-y-4">
        <p className="text-label text-neutral-30 uppercase tracking-widest">
          Button variants
        </p>
        <p className="text-caption text-coal-60">
          Default variant uses Tailwind <code className="bg-lyserosa px-1 rounded">primary</code> /
          <code className="bg-lyserosa px-1 rounded">primary-foreground</code> from the theme (Peppes
          red on white text). Optional brand overrides in{" "}
          <code className="bg-lyserosa px-1 rounded">globals.css</code> apply to other surfaces.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button type="button" variant="default">
            Primary
          </Button>
          <Button type="button" variant="secondary">
            Secondary
          </Button>
          <Button type="button" variant="ghost">
            Ghost
          </Button>
          <Button type="button" variant="outline">
            Outline
          </Button>
          <Button type="button" variant="destructive">
            Destructive
          </Button>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 max-w-md">
        <p className="text-label text-neutral-30 uppercase tracking-widest">
          Input &amp; label
        </p>
        <div className="space-y-2">
          <Label htmlFor="dg-input-default">Default</Label>
          <Input id="dg-input-default" placeholder="Placeholder" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dg-input-focus">Focus ring (tab here)</Label>
          <Input id="dg-input-focus" placeholder="Focus me" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dg-input-error" className="text-danger">
            Error state
          </Label>
          <Input
            id="dg-input-error"
            aria-invalid
            className="border-danger focus-visible:ring-danger/30"
            defaultValue="Invalid value"
          />
          <p className="text-caption text-danger">Example: invalid email</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dg-input-disabled" className="text-muted">
            Disabled
          </Label>
          <Input id="dg-input-disabled" disabled placeholder="Unavailable" />
        </div>
      </div>

      {/* Dialog */}
      <div className="space-y-4">
        <p className="text-label text-neutral-30 uppercase tracking-widest">
          Dialog (modal surface)
        </p>
        <p className="text-caption text-coal-60">
          Panel uses <code className="bg-lyserosa px-1 rounded">bg-background</code> and theme
          border/foreground tokens so it matches the rest of the app.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              Open sample dialog
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modal preview</DialogTitle>
              <DialogDescription>
                This panel should match the page background tone, not a stark white card.
              </DialogDescription>
            </DialogHeader>
            <p className="text-body text-foreground">
              Body text follows the default foreground colour on the themed background.
            </p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Avatars */}
      <div className="space-y-4">
        <p className="text-label text-neutral-30 uppercase tracking-widest">
          Avatar sizes
        </p>
        <p className="text-caption text-coal-60">
          Radix Avatar + fallback initials; ring uses coal tokens for contrast on light-bg.
        </p>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8 border border-coal-20">
              <AvatarFallback className="text-caption">SM</AvatarFallback>
            </Avatar>
            <span className="text-caption text-coal-60">8×8</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-10 w-10 border border-coal-20">
              <AvatarFallback className="text-label">MD</AvatarFallback>
            </Avatar>
            <span className="text-caption text-coal-60">10×10</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-12 w-12 border border-coal-20">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <span className="text-caption text-coal-60">12×12</span>
          </div>
        </div>
      </div>
    </section>
  );
}
