"use client";

import { useEffect, useState } from "react";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";

export default function ClockWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = widget.data.timezone;
  const time = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
    : "--:--";
  const secs = now
    ? now.toLocaleTimeString("fr-FR", { timeZone: tz, second: "2-digit" })
    : "--";
  const date = now
    ? now.toLocaleDateString("fr-FR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => (
        <div className="flex flex-col h-full justify-between">
          {/* Heure — massive en grid pour être lisible depuis la TV */}
          <div>
            <div
              className="font-mono font-black text-text tabular-nums leading-none"
              style={{
                fontSize: m === "grid"
                  ? "clamp(3.5rem, 5.5vw, 5.5rem)"
                  : m === "fullscreen"
                  ? "clamp(10rem, 20vw, 18rem)"
                  : "clamp(5rem, 9vw, 8rem)",
              }}
            >
              {time}
              {m !== "grid" && (
                <span className="text-violet font-semibold align-baseline" style={{ fontSize: "0.3em", marginLeft: "0.3em" }}>
                  {secs}
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <div>
            <div className={`capitalize text-sub ${m === "grid" ? "text-sm" : m === "fullscreen" ? "text-2xl" : "text-base"}`}>
              {date}
            </div>
          </div>
        </div>
      )}
    </WidgetWrapper>
  );
}
