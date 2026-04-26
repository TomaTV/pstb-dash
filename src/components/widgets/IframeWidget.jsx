"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { transformVideoUrl } from "@/lib/widgets";

export default function IframeWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { url } = widget.data ?? {};

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => (
        <div className="w-full h-full bg-black overflow-hidden relative">
           {url ? (
             url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith("data:image/") ? (
               <img src={url} className="w-full h-full object-cover" alt="Document" />
             ) : (() => {
               const { url: finalUrl, isEmbed, params } = transformVideoUrl(url);
               if (isEmbed) {
                 return (
                   <iframe 
                     src={`${finalUrl}?${params}`} 
                     className="w-full h-full border-0 pointer-events-none" 
                     allow="autoplay" 
                   />
                 );
               }

               if (finalUrl.match(/\.(mp4|mov|webm)$/i) || finalUrl.startsWith("data:video/")) {
                 return (
                   <video 
                     src={finalUrl} 
                     className="w-full h-full object-cover" 
                     autoPlay 
                     muted 
                     loop 
                     playsInline 
                   />
                 );
               }
               return <iframe src={finalUrl} className="w-full h-full border-0" allowFullScreen />;
             })()
           ) : (
             <div className="w-full h-full flex items-center justify-center text-sub">
                Aucune URL configurée
             </div>
           )}
        </div>
      )}
    </WidgetWrapper>
  );
}
