"use client";

import { useDashboard } from "@/context/DashboardContext";
import WidgetWrapper from "@/components/WidgetWrapper";
import QRCode from "react-qr-code";
import { User, Calendar, Megaphone } from "lucide-react";

export default function StudentWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2 flex items-center gap-1.5">
                  <Megaphone className="w-3 h-3" /> Étudiants & BDE
                </div>
                <div className="text-lg font-bold text-white leading-tight line-clamp-2">
                  {d.title}
                </div>
              </div>
              <div className="text-[10px] text-sub font-mono truncate">{d.submitter || "BDE"}</div>
            </div>
          );
        }

        // ═══════ FULLSCREEN / FOCUS ═══════
        
        // EMPTY STATE (Call to Action)
        if (!d.title) {
          const submitUrl = typeof window !== "undefined" ? `${window.location.origin}/etudiants` : "https://pstb.fr";
          return (
            <div className="relative h-full w-full bg-[#050505] flex items-center justify-center p-16">
              <div className="absolute inset-0 bg-gradient-to-br from-violet/20 to-[#050505]" />
              <div className="relative z-10 text-center flex flex-col items-center">
                <div className="flex items-center gap-3 text-violet font-bold uppercase tracking-widest text-sm mb-6 bg-violet/10 px-6 py-2 rounded-full">
                  <Megaphone className="w-5 h-5" /> BDE & Vie Associative
                </div>
                <h1 className="text-6xl font-black text-white leading-tight mb-6">
                  Aucun événement pour l'instant
                </h1>
                <p className="text-2xl text-white/60 max-w-2xl font-medium mb-12">
                  Vous organisez une soirée, une conférence ou un tournoi ? Scannez ce QR Code pour proposer votre événement sur les écrans du campus !
                </p>
                <div className="bg-white p-6 shadow-[0_0_50px_rgba(101,31,255,0.3)] rounded-3xl">
                  <QRCode value={submitUrl} size={220} />
                </div>
                <div className="mt-6 text-white/40 uppercase tracking-widest text-sm font-bold">
                  Accéder au formulaire BDE
                </div>
              </div>
            </div>
          );
        }

        // NORMAL STATE
        return (
          <div className="relative h-full w-full bg-[#050505] flex overflow-hidden">
            {/* Split layout: Left Image/Design, Right Content */}
            <div className="w-1/2 relative flex flex-col justify-center p-14 bg-white/[0.02]">
              {d.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${d.imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet/20 to-[#050505]" />
              )}
              
              <div className="relative z-10 mt-auto">
                <div className="flex items-center gap-3 text-violet font-bold uppercase tracking-widest text-sm mb-4">
                  <User className="w-5 h-5" /> {d.submitter || "Vie Associative"}
                </div>
                <h1 className="text-5xl font-black text-white leading-tight drop-shadow-2xl">
                  {d.title}
                </h1>
                {d.dateLabel && (
                  <div className="flex items-center gap-2 text-white/80 font-semibold text-lg mt-6 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md">
                    <Calendar className="w-5 h-5" /> {d.dateLabel}
                  </div>
                )}
              </div>
            </div>

            <div className="w-1/2 flex flex-col justify-center p-16">
              <p className="text-2xl text-white/70 leading-relaxed font-medium mb-12">
                {d.description}
              </p>

              {d.qrUrl && (
                <div className="flex items-center gap-8">
                  <div className="bg-white p-4 shadow-2xl rounded-xl">
                    <QRCode value={d.qrUrl} size={140} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-violet tracking-widest uppercase mb-1">
                      Scannez pour
                    </div>
                    <div className="text-xl font-bold text-white">En savoir plus</div>
                    <div className="text-sm text-white/40 mt-1">Lien direct</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
