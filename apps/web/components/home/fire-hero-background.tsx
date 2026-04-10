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
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-background"
    >
      <AnimatedGradient
        config={{
          preset: "custom",
          color1: "#FF9F21",
          color2: "#cd1719",
          color3: "#fffdf9",
          rotation: 114,
          proportion: 100,
          scale: 0.52,
          speed: reduceMotion ? 0 : 28,
          distortion: 7,
          swirl: 18,
          swirlIterations: 20,
          softness: 100,
          offset: 717,
          shape: "Edge",
          shapeSize: 12,
        }}
        className="h-full w-full"
        style={{ zIndex: 0 }}
      />
    </div>
  );
}
