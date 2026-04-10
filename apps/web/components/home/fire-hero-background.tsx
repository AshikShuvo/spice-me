"use client";

import * as React from "react";

import AnimatedGradient from "@/components/animated-gradient";

/**
 * WebGL animated gradient (Spell UI “Lava” preset) — see
 * https://spell.sh/docs/animated-gradient
 */
export function FireHeroBackground() {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#0a0505]">
      <AnimatedGradient
        config={{
          preset: "Lava",
          speed: reduceMotion ? 0 : 28,
        }}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
