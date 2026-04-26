"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function IframeWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { url } = widget.data;

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => (
        <div className="absolute inset-0 overflow-hidden bg-black">
           {url ? (
             url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith("data:image/") ? (
               <img src={url} className="w-full h-full object-cover" alt="Document" />
             ) : (
               <iframe src={url} className="w-full h-full border-0" allowFullScreen />
             )
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
