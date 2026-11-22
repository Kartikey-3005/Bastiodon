"use client";

import { useEffect, useRef, useState } from "react";

export interface SliderRevolutionHeroProps {
  embedKey?: string;
  ariaLabel?: string;
  className?: string;
  placeholderClassName?: string;
}

const join = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

export function SliderRevolutionHero({
  embedKey = "ek_biqgfhte6l7dhaya3qyw",
  ariaLabel = "Bastiodon Hero",
  className,
  placeholderClassName = "h-svh min-h-[700px]",
}: SliderRevolutionHeroProps) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    setReady(false);
    setFailed(false);

    let isMounted = true;

    // Load the custom scene JSON first, then load the custom embed loader
    fetch("/scene_bastiodon.json")
      .then((res) => res.json())
      .then((scene) => {
        if (!isMounted) return;
        // Strip watermark from scene configuration
        if (scene && scene.settings && scene.settings.watermark) {
          delete scene.settings.watermark;
        }
        (window as unknown as { __BASTIODON_SCENE?: unknown }).__BASTIODON_SCENE = scene;

        // Monkey-patch SR7 canvas watermark function in window before or when SR7 initializes
        const win = window as any;
        win.SR7 = win.SR7 || {};
        win.SR7.F = win.SR7.F || {};
        win.SR7.F.canvas = win.SR7.F.canvas || function() {};
        win.SR7.F.canvas.prototype = win.SR7.F.canvas.prototype || {};
        win.SR7.F.canvas.prototype._wm = function() { /* No-op watermark drawing */ };

        const script = document.createElement("script");
        script.src = "/embed_bastiodon.js";
        script.async = true;
        script.onerror = () => {
          if (isMounted) setFailed(true);
        };
        el.appendChild(script);
      })
      .catch(() => {
        if (isMounted) setFailed(true);
      });

    const observer = new ResizeObserver(() => {
      if (el.offsetHeight > 0) setReady(true);
    });
    observer.observe(el);

    return () => {
      isMounted = false;
      observer.disconnect();
      el.replaceChildren();
      const loaders = (window as unknown as { __sraLoaders?: Record<string, unknown> }).__sraLoaders;
      if (loaders) {
        delete loaders["SR7_" + embedKey.replace(/[^A-Za-z0-9]/g, "") + "_1"];
      }
    };
  }, [embedKey]);

  return (
    <section aria-label={ariaLabel} aria-busy={!ready && !failed} className={join("relative w-full", className)}>
      <style jsx global>{`
        /* Hide any leftover Slider Revolution watermark pills or links */
        .sr-anywhere-wm,
        a[aria-label*="Slider Revolution"],
        a[href*="sliderrevolution.com"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }
      `}</style>
      {!ready && (
        <div
          aria-hidden="true"
          className={join("w-full bg-[#070A09]", !failed && "animate-pulse", placeholderClassName)}
        />
      )}
      <div ref={host} className="sr-anywhere-embed-host w-full" />
    </section>
  );
}

export default SliderRevolutionHero;
