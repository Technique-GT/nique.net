import { useEffect } from "react";

export function AdsenseUnit() {
  useEffect(() => {
    try {
      // @ts-expect-error - adsbygoogle is injected by AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // no-op in dev
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-9496613824414881"
      data-ad-slot="YOUR_AD_SLOT_ID"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}