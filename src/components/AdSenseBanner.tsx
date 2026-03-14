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
      console.log("AdSense hint: Ads might be blocked or still loading.");
    }
  }, []);

  return (
    <div className="w-full my-8 overflow-hidden flex justify-center bg-secondary/5 rounded-[2.5rem] border border-dashed border-primary/10 py-6 px-4 relative min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1723988485446029"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">РЕКЛАМА</span>
      </div>
    </div>
  );
}
