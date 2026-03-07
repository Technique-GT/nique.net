let adsenseLoadPromise: Promise<void> | null = null;

const ADSENSE_SCRIPT_SELECTOR = 'script[data-adsense-script="true"]';
const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9496613824414881";

export const loadAdSenseScript = (): Promise<void> => {
  if (!import.meta.env.PROD) {
    return Promise.resolve();
  }

  const adsWindow = window as Window & { adsbygoogle?: unknown[] };
  if (Array.isArray(adsWindow.adsbygoogle)) {
    return Promise.resolve();
  }

  if (adsenseLoadPromise) {
    return adsenseLoadPromise;
  }

  adsenseLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(ADSENSE_SCRIPT_SELECTOR) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("AdSense script failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = ADSENSE_SRC;
    script.crossOrigin = "anonymous";
    script.dataset.adsenseScript = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("AdSense script failed to load"));
    document.head.appendChild(script);
  });

  return adsenseLoadPromise;
};
