"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { transformVideoUrl } from "@/lib/widgets";

export default function VideoWidget({ widget, mode = "grid" }) {
  const { videoUrl, objectFit = "cover" } = widget.data ?? {};

  return (
    <WidgetWrapper widget={widget} mode={mode}>
      {({ mode: m }) => (
        <div className="absolute inset-0 bg-black overflow-hidden">
          {videoUrl ? (() => {
            const { url, isEmbed, params } = transformVideoUrl(videoUrl);
            if (isEmbed) {
              return (
                <iframe 
                  src={`${url}?${params}`} 
                  className="w-full h-full border-0 pointer-events-none scale-110" 
                  allow="autoplay" 
                />
              );
            }

            return (
              <video
                src={url}
                className={`w-full h-full ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
                autoPlay
                muted
                loop
                playsInline
              />
            );
          })() : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3">
              <div className="p-4 rounded-full bg-white/5 border border-white/10">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              </div>
              <p className="text-xs uppercase tracking-widest font-bold">Aucune vidéo</p>
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
