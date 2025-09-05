"use client";

import { useEffect, useRef } from "react";

interface BannerAdProps {
  slot?: string;
  style?: React.CSSProperties;
  format?: string;
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const BannerAd: React.FC<BannerAdProps> = ({
  slot = "XXXXXXXXXX",
  style = { display: "block", textAlign: "center", minHeight: "100px" },
  format = "auto",
  responsive = true,
  className = "adsbygoogle",
  ...props
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // In development, show placeholder
        if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
          if (adRef.current) {
            adRef.current.innerHTML = `
              <div style="
                background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
                border: 2px dashed #ccc;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                color: #666;
                font-family: system-ui, -apple-system, sans-serif;
                min-height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
              ">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">
                  📢 Google AdSense Banner
                </div>
                <div style="font-size: 12px; opacity: 0.7;">
                  Advertisement space (${format} format)
                </div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.5;">
                  Slot: ${slot}
                </div>
              </div>
            `;
          }
          return;
        }

        // Production: Load actual ads
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error("AdSense error:", error);
        // Fallback placeholder
        if (adRef.current) {
          adRef.current.innerHTML = `
            <div style="
              background: #f8f8f8;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 20px;
              text-align: center;
              color: #999;
              font-size: 12px;
              min-height: 90px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              Advertisement
            </div>
          `;
        }
      }
    }
  }, [slot, format]);

  return (
    <div className="w-full flex justify-center py-2">
      <ins
        ref={adRef}
        className={className}
        style={style}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
        {...props}
      />
    </div>
  );
};

export default BannerAd;