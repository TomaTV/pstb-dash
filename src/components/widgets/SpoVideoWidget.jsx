"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { transformVideoUrl } from "@/lib/widgets";


function fmtDate(iso) {
  if (!iso) return { day: "—", month: "—", weekday: "—", time: "—" };
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleDateString("fr-FR", { month: "long" }),
    weekday: d.toLocaleDateString("fr-FR", { weekday: "long" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function SpoVideoWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const dt = fmtDate(d.date);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between overflow-hidden relative">
              {d.videoUrl && (() => {
                const { url, isEmbed, params } = transformVideoUrl(d.videoUrl);
                return (
                  <div className="absolute inset-0 z-0">
                    {isEmbed ? (
                      <iframe src={`${url}?${params}`} className="w-full h-full border-0 pointer-events-none scale-110" allow="autoplay" />
                    ) : (
                      <video src={url} className="w-full h-full object-cover opacity-40" autoPlay muted loop playsInline />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                  </div>
                );
              })()}



              <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2">SPO · Vidéo Live</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text tabular-nums">{dt.day}</span>
                  <span className="text-sm uppercase tracking-widest text-sub">{dt.month}</span>
                </div>
                <p className="text-xs text-sub mt-2 line-clamp-1">{d.title ?? "Soirée portes ouvertes"}</p>
              </div>
            </div>

          );
        }

        return (
          <div className="relative h-full w-full overflow-hidden bg-black">
            {/* Background Video */}
              {d.videoUrl ? (() => {
                const { url, isEmbed, params } = transformVideoUrl(d.videoUrl);
                if (isEmbed) {
                  return (
                    <div className="absolute inset-0 w-full h-full">
                      <iframe src={`${url}?${params}`} className="w-full h-full border-0 pointer-events-none scale-[1.02]" allow="autoplay" />
                    </div>
                  );
                }
                return (
                  <video 
                    src={url} 
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                  />
                );
              })() : (


              <div className="absolute inset-0 bg-gradient-to-br from-violet/40 to-blue-900/60" />
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 z-10" />
            <div className="absolute inset-0 bg-black/20 z-10" />

            {/* Content layer */}
            {!d.hideContent && (
              <div className="relative z-30 h-full flex flex-col px-20 py-16" style={{ paddingBottom: "var(--safe-bottom, 4rem)" }}>
                
                {/* Top Section */}
                <div className="flex justify-between items-start">
                  <img src="/Logo.svg" alt="PST&amp;B" className="brightness-0 invert drop-shadow-2xl"
                    style={{ height: m === "fullscreen" ? "7rem" : "3.5rem" }} />
                  
                  <div className="text-right">
                    <div className="text-[12px] font-bold uppercase tracking-[0.5em] text-white/60 mb-2">Évènement spécial</div>
                    <div className="text-3xl font-black text-white">{dt.weekday}</div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="px-3 py-1 rounded-full bg-violet text-white text-[10px] font-black uppercase tracking-widest">Live Campus</span>
                      <span className="h-px w-24 bg-white/20" />
                    </div>

                    <h1 className="font-black text-white leading-[0.9] tracking-tighter mb-8"
                        style={{ fontSize: "clamp(3.5rem, 7vw, 9rem)" }}>
                      {d.title ?? "SOIRÉE PORTES OUVERTES"}
                    </h1>

                    <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
                      {/* Date Big */}
                      <div className="flex items-baseline gap-4">
                        <span className="font-black text-white tabular-nums leading-none" style={{ fontSize: "clamp(4rem, 6vw, 7rem)" }}>
                          {dt.day}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-bold text-white uppercase tracking-[0.2em] text-2xl">
                            {dt.month}
                          </span>
                          <span className="font-medium text-white/40 text-lg">
                            {d.date ? new Date(d.date).getFullYear() : ""}
                          </span>
                        </div>
                      </div>

                      {/* Info Blocks */}
                      <div className="flex gap-10 border-l border-white/10 pl-10 py-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-violet mb-1">Lieu</div>
                          <div className="text-xl font-bold text-white">{d.location ?? "Campus Paris"}</div>
                        </div>
                      </div>


                      {/* QR Space */}
                      {d.qrUrl && (
                        <div className="ml-auto flex items-center gap-6 bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Scanner pour</div>
                            <div className="text-sm font-bold text-white uppercase">{d.cta || "S'inscrire"}</div>
                          </div>
                          <div className="w-20 h-20 bg-white p-1.5 rounded-lg shadow-2xl">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(d.qrUrl)}`} alt="QR Code" className="w-full h-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Cinematic bar animation or something subtle */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-violet transition-all duration-1000 ease-linear" style={{ width: "100%" }} />
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
