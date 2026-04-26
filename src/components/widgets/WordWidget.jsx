"use client";

import { BookOpen } from "lucide-react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function WordWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-violet font-bold mb-2">Mot du jour</div>
                <div className="text-xl font-bold text-white line-clamp-1">{d.word ?? "Terme"}</div>
              </div>
              <p className="text-xs text-sub line-clamp-2 mt-2">{d.definition ?? "Définition..."}</p>
            </div>
          );
        }

        // FULLSCREEN
        return (
          <div className="relative h-full w-full bg-[#0a0a0a] flex items-center justify-center p-16 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-violet/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full mix-blend-screen" />
            
            {m === "grid" && (
              <div className="absolute top-12 left-12 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center">
                  <BookOpen size={24} className="text-violet" />
                </div>
                <div className="text-sm font-bold uppercase tracking-[0.4em] text-white/50">
                  Lexique {d.category ?? "Tech & Business"}
                </div>
              </div>
            )}

            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center">
              <div className="text-violet text-2xl md:text-3xl font-mono mb-6 opacity-80">
                [{d.pronunciation ?? "pro-non-cia-tion"}]
              </div>
              
              <h1 className="text-white font-black tracking-tight leading-none mb-12"
                  style={{ fontSize: m === "fullscreen" ? "8rem" : "5rem" }}>
                {d.word ?? "Terme"}
              </h1>
              
              <div className="w-24 h-1 bg-gradient-to-r from-violet to-blue-500 rounded-full mb-12" />
              
              <p className="text-white/80 font-medium leading-relaxed max-w-4xl"
                 style={{ fontSize: m === "fullscreen" ? "2.5rem" : "1.5rem" }}>
                {d.definition ?? "Définition claire et précise du terme, expliquant son utilité dans le monde professionnel."}
              </p>

              {d.example && (
                <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-8 max-w-3xl text-left border-l-4 border-l-violet">
                  <div className="text-sm font-bold uppercase tracking-widest text-violet mb-3">Exemple d'usage</div>
                  <div className="text-white/70 italic text-xl">« {d.example} »</div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
