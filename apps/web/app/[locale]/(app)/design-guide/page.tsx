import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { DesignGuideUiShowcase } from "./design-guide-ui-showcase";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

// ─── Data ───────────────────────────────────────────────────────────────────

const typographyTokens = [
  {
    label: "text-display",
    cls: "text-display",
    sample: "Display — Hero Impact",
    meta: "Ringside Compressed · 900 Black · 4.5rem",
  },
  {
    label: "text-headline",
    cls: "text-headline",
    sample: "Headline — Major Title",
    meta: "Ringside Compressed · 700 Bold · 3rem",
  },
  {
    label: "text-title",
    cls: "text-title",
    sample: "Title — Section Header",
    meta: "Ringside Compressed · 700 Bold · 2rem",
  },
  {
    label: "text-subheading",
    cls: "text-subheading",
    sample: "Subheading — Card Header",
    meta: "Ringside Compressed · 500 Medium · 1.5rem",
  },
  {
    label: "text-body-lg",
    cls: "text-body-lg",
    sample: "Body Large — Introductory prose for sections.",
    meta: "Ringside Narrow · 400 Book · 1.125rem",
  },
  {
    label: "text-body",
    cls: "text-body",
    sample: "Body — Default paragraph text used across the application.",
    meta: "Ringside Narrow · 400 Book · 1rem",
  },
  {
    label: "text-body-italic",
    cls: "text-body-italic",
    sample: "Body Italic — Emphasis, quotes, supporting copy.",
    meta: "Ringside Narrow · 400 Italic · 1rem",
  },
  {
    label: "text-label",
    cls: "text-label",
    sample: "LABEL — UI Tags, Form Labels",
    meta: "Ringside Narrow · 700 Bold · 0.875rem",
  },
  {
    label: "text-caption",
    cls: "text-caption",
    sample: "Caption — Fine print, metadata, timestamps",
    meta: "Ringside Narrow · 400 Book · 0.75rem",
  },
] as const;

const semanticTokens = [
  { label: "text-info", cls: "text-body text-info", sample: "Info — Informational message" },
  { label: "text-warning", cls: "text-body text-warning", sample: "Warning — Proceed with caution" },
  { label: "text-danger", cls: "text-body text-danger", sample: "Danger — Destructive or error state" },
  { label: "text-success", cls: "text-body text-success", sample: "Success — Action completed" },
  { label: "text-muted", cls: "text-body text-muted", sample: "Muted — Secondary / disabled copy" },
] as const;

type Swatch = {
  name: string;
  token: string;
  bg: string;
  dark?: boolean;
};

const colorGroups: { group: string; swatches: Swatch[] }[] = [
  {
    group: "Peppes Red",
    swatches: [
      { name: "peppes-red", token: "--color-peppes-red", bg: "bg-peppes-red", dark: true },
      { name: "peppes-red-80", token: "--color-peppes-red-80", bg: "bg-peppes-red-80", dark: true },
      { name: "peppes-red-60", token: "--color-peppes-red-60", bg: "bg-peppes-red-60", dark: true },
      { name: "peppes-red-40", token: "--color-peppes-red-40", bg: "bg-peppes-red-40" },
      { name: "peppes-red-20", token: "--color-peppes-red-20", bg: "bg-peppes-red-20" },
      { name: "peppes-red-10", token: "--color-peppes-red-10", bg: "bg-peppes-red-10" },
    ],
  },
  {
    group: "Glowing Red",
    swatches: [
      { name: "glowing-red", token: "--color-glowing-red", bg: "bg-glowing-red", dark: true },
      { name: "glowing-red-80", token: "--color-glowing-red-80", bg: "bg-glowing-red-80", dark: true },
      { name: "glowing-red-60", token: "--color-glowing-red-60", bg: "bg-glowing-red-60", dark: true },
      { name: "glowing-red-40", token: "--color-glowing-red-40", bg: "bg-glowing-red-40" },
      { name: "glowing-red-20", token: "--color-glowing-red-20", bg: "bg-glowing-red-20" },
      { name: "glowing-red-10", token: "--color-glowing-red-10", bg: "bg-glowing-red-10" },
    ],
  },
  {
    group: "Coal",
    swatches: [
      { name: "coal", token: "--color-coal", bg: "bg-coal", dark: true },
      { name: "coal-80", token: "--color-coal-80", bg: "bg-coal-80", dark: true },
      { name: "coal-60", token: "--color-coal-60", bg: "bg-coal-60", dark: true },
      { name: "coal-20", token: "--color-coal-20", bg: "bg-coal-20" },
      { name: "coal-10", token: "--color-coal-10", bg: "bg-coal-10" },
    ],
  },
  {
    group: "Neutrals",
    swatches: [
      { name: "neutral-20", token: "--color-neutral-20", bg: "bg-neutral-20", dark: true },
      { name: "neutral-30", token: "--color-neutral-30", bg: "bg-neutral-30", dark: true },
      { name: "lyserosa", token: "--color-lyserosa", bg: "bg-lyserosa" },
      { name: "neutral-95", token: "--color-neutral-95", bg: "bg-neutral-95" },
      { name: "light-bg", token: "--color-light-bg", bg: "bg-light-bg" },
    ],
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DesignGuidePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen w-full max-w-5xl space-y-20 px-8 py-16 text-left">

      {/* Header */}
      <header className="border-b border-coal-20 pb-8">
        <p className="text-label text-peppes-red mb-2">Design Guide</p>
        <h1 className="text-display text-coal">Typography &amp; Colour</h1>
        <p className="text-body-lg text-neutral-30 mt-3">
          A live reference of every type scale, semantic colour, and palette token
          in use across the application.
        </p>
      </header>

      {/* ── Typography scale ─────────────────────────────────────────────── */}
      <section className="space-y-12">
        <h2 className="text-title text-coal border-b border-coal-20 pb-4">
          Type Scale
        </h2>

        {/* Compressed — Display family */}
        <div className="space-y-2">
          <p className="text-label text-neutral-30 uppercase tracking-widest mb-6">
            Ringside Compressed — Display &amp; Headings
          </p>
          <div className="space-y-8">
            {typographyTokens
              .filter((t) =>
                ["text-display", "text-headline", "text-title", "text-subheading"].includes(
                  t.label
                )
              )
              .map((t) => (
                <div key={t.label} className="grid grid-cols-[1fr_auto] items-baseline gap-4">
                  <span className={`${t.cls} text-coal leading-none`}>{t.sample}</span>
                  <span className="text-caption text-neutral-30 text-right whitespace-nowrap">
                    <code className="bg-lyserosa px-1.5 py-0.5 rounded text-[0.7rem]">
                      .{t.label}
                    </code>
                    <br />
                    <span className="text-coal-60">{t.meta}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Narrow — Body family */}
        <div className="space-y-2">
          <p className="text-label text-neutral-30 uppercase tracking-widest mb-6">
            Ringside Narrow — Body &amp; UI
          </p>
          <div className="space-y-6">
            {typographyTokens
              .filter((t) =>
                ["text-body-lg", "text-body", "text-body-italic", "text-label", "text-caption"].includes(
                  t.label
                )
              )
              .map((t) => (
                <div key={t.label} className="grid grid-cols-[1fr_auto] items-baseline gap-4">
                  <span className={`${t.cls} text-coal`}>{t.sample}</span>
                  <span className="text-caption text-neutral-30 text-right whitespace-nowrap">
                    <code className="bg-lyserosa px-1.5 py-0.5 rounded text-[0.7rem]">
                      .{t.label}
                    </code>
                    <br />
                    <span className="text-coal-60">{t.meta}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Semantic text colours */}
        <div>
          <p className="text-label text-neutral-30 uppercase tracking-widest mb-6">
            Semantic Text Colours
          </p>
          <div className="space-y-3">
            {semanticTokens.map((t) => (
              <div key={t.label} className="flex items-center gap-4">
                <span className={`${t.cls} flex-1`}>{t.sample}</span>
                <code className="text-caption bg-lyserosa px-1.5 py-0.5 rounded text-coal-60">
                  .{t.label}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Colour palette ───────────────────────────────────────────────── */}
      <section className="space-y-12">
        <h2 className="text-title text-coal border-b border-coal-20 pb-4">
          Colour Palette
        </h2>

        {colorGroups.map(({ group, swatches }) => (
          <div key={group}>
            <p className="text-label text-neutral-30 uppercase tracking-widest mb-4">
              {group}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {swatches.map((s) => (
                <div key={s.name} className="flex flex-col gap-2">
                  <div
                    className={`${s.bg} h-16 rounded-lg border border-coal-10 flex items-end p-2`}
                  >
                    {s.dark && (
                      <span className="text-[0.6rem] font-bold text-white/70 uppercase tracking-wide leading-none">
                        {s.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-caption text-coal font-medium leading-tight">
                      {s.name}
                    </p>
                    <code className="text-[0.65rem] text-coal-60 leading-tight block">
                      {s.token}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <DesignGuideUiShowcase />

      {/* ── Checkerboard for transparent swatches ────────────────────────── */}
      <section>
        <h2 className="text-title text-coal border-b border-coal-20 pb-4 mb-8">
          Opacity Tokens on Dark
        </h2>
        <div
          className="rounded-xl p-8 grid grid-cols-3 sm:grid-cols-6 gap-4"
          style={{ background: "var(--color-coal)" }}
        >
          {[
            { name: "peppes-red-80", bg: "bg-peppes-red-80" },
            { name: "peppes-red-60", bg: "bg-peppes-red-60" },
            { name: "peppes-red-40", bg: "bg-peppes-red-40" },
            { name: "peppes-red-20", bg: "bg-peppes-red-20" },
            { name: "peppes-red-10", bg: "bg-peppes-red-10" },
            { name: "coal-20", bg: "bg-coal-20" },
          ].map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <div className={`${s.bg} h-14 rounded-lg`} />
              <p className="text-[0.65rem] text-white/60 leading-tight">{s.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-coal-20 pt-6">
        <p className="text-caption text-coal-60">
          Route: <code className="bg-lyserosa px-1.5 py-0.5 rounded">/{locale}/design-guide</code>
          {" · "}Tokens defined in{" "}
          <code className="bg-lyserosa px-1.5 py-0.5 rounded">
            packages/tailwind-config/shared-style.css
          </code>
        </p>
      </footer>
    </main>
  );
}
