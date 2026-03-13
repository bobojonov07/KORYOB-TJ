"use client";

import { useEffect } from "react";

interface AdSenseBannerProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle";
  fullWidthResponsive?: boolean;
}

export function AdSenseBanner({ adSlot, adFormat = "auto", fullWidthResponsive = true }: AdSenseBannerProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full my-8 overflow-hidden flex justify-center bg-muted/5 rounded-2xl border border-dashed border-primary/10 py-4">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}
