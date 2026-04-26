"use client";

import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Quote } from "lucide-react";

export default function QuoteWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const { text = "", author = "", role = "" } = widget.data ?? {};

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => (
        <div className={
          m === "grid"
            ? "-mx-5 -mt-3 -mb-5 h-[calc(100%+2rem)] w-[calc(100%+2.5rem)]"
            : "h-full w-full"
        }>
          <div className="relative h-full w-full bg-gradient-to-br from-[#0A0A0A] via-[#100520] to-black overflow-hidden flex items-center justify-center">
            {/* halos */}
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-violet/10 blur-[120px]" />
            <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-fuchsia-500/5 blur-[120px]" />

            <div className="relative z-10 max-w-6xl mx-auto px-10 text-center">
              <Quote
                size={m === "fullscreen" ? 80 : m === "focus" ? 56 : 28}
                className="text-violet mx-auto mb-6 opacity-80"
                strokeWidth={1.5}
              />
              <blockquote
                className="text-white font-bold leading-[1.15] tracking-tight"
                style={{
                  fontSize:
                    m === "fullscreen" ? "5rem" :
                    m === "focus"      ? "3rem" :
                                         "1.05rem",
                }}
              >
                <span className="text-violet/70">«</span>{" "}{text}{" "}<span className="text-violet/70">»</span>
              </blockquote>

              {(author || role) && (
                <div className="mt-8">
                  <div
                    className="h-px w-16 bg-violet mx-auto mb-4"
                  />
                  <div
                    className="font-semibold text-white tracking-wide"
                    style={{ fontSize: m === "fullscreen" ? "1.75rem" : m === "focus" ? "1.25rem" : "0.85rem" }}
                  >
                    {author}
                  </div>
                  {role && (
                    <div
                      className="text-white/55 mt-1 uppercase tracking-[0.25em] font-medium"
                      style={{ fontSize: m === "fullscreen" ? "0.95rem" : m === "focus" ? "0.75rem" : "0.6rem" }}
                    >
                      {role}
                    </div>
                  )}
                </div>
              )}

              {m !== "grid" && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">
                  Quote · PST&B
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
