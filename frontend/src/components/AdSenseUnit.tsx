import { useEffect, useRef, useState } from "react";
import { loadAdSenseScript } from "../utils/loadAdSense";

type AdsWindow = Window & { adsbygoogle?: unknown[] };

type AdsenseUnitProps = {
  adSlot: string;
  className?: string;
};

export function AdsenseUnit({ adSlot, className }: AdsenseUnitProps) {
  const containerRef = useRef<HTMLModElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsNearViewport(true);
            observer.disconnect();
            break;
          }
        }
      },
      {
        rootMargin: "300px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isNearViewport) return;

    let cancelled = false;
    const initialize = async () => {
      try {
        await loadAdSenseScript();
        if (cancelled) return;
        const adsWindow = window as AdsWindow;
        adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
        adsWindow.adsbygoogle.push({});
      } catch {
        // Ignore ad failures to avoid user-facing errors.
      }
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, [isNearViewport]);

  return (
    <ins
      ref={containerRef}
      className={className ? `adsbygoogle ${className}` : "adsbygoogle"}
      style={{ display: "block" }}
      data-ad-client="ca-pub-9496613824414881"
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
      aria-label="Advertisement"
    />
  );
}
