"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WidgetWrapper from "@/components/WidgetWrapper";
import { useDashboard } from "@/context/DashboardContext";
import { Images } from "lucide-react";

export default function GalleryWidget({ widget, mode = "grid" }) {
  const { focusWidget } = useDashboard();
  const d = widget.data ?? {};
  const images = Array.isArray(d.images) ? d.images : [];
  const interval = (d.interval ?? 5) * 1000;
  
  // We want to show a grid of up to 8 photos.
  const slotsCount = 8;
  const [displayedIndices, setDisplayedIndices] = useState([]);
  const [flipState, setFlipState] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    // Initial assignment
    const initial = [];
    for (let i = 0; i < Math.min(slotsCount, images.length); i++) {
      initial.push(i);
    }
    // Do NOT fill remaining slots. Just show exactly images.length up to slotsCount
    setDisplayedIndices(initial);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= slotsCount) return; // No need to rotate if all fit
    
    const id = setInterval(() => {
      setDisplayedIndices(prev => {
        const next = [...prev];
        // Pick 2 random slots to update, but only out of the currently displayed slots!
        const maxSlots = Math.min(slotsCount, images.length);
        if (maxSlots < 2) return prev; // Cannot rotate 2 slots if we have fewer than 2

        const slot1 = Math.floor(Math.random() * maxSlots);
        let slot2 = Math.floor(Math.random() * maxSlots);
        while (slot1 === slot2) slot2 = Math.floor(Math.random() * maxSlots);
        
        // Find highest index currently displayed
        const maxIdx = Math.max(...next);
        next[slot1] = (maxIdx + 1) % images.length;
        next[slot2] = (maxIdx + 2) % images.length;
        
        return next;
      });
      setFlipState(f => f + 1); // Trigger re-render for animation
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <WidgetWrapper widget={widget} mode={mode} onClick={() => focusWidget(widget.id)}>
      {({ mode: m }) => {
        if (m === "grid") {
          return (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <Images size={14} className="text-violet" />
                <span className="text-xs uppercase tracking-widest text-sub">{d.title ?? "Galerie"}</span>
              </div>
              <div className="flex-1 mt-2 -mx-1 grid grid-cols-3 gap-1">
                {images.slice(0, 6).map((im, i) => (
                  <div key={i} className="aspect-square rounded overflow-hidden bg-elevated">
                    {im.url && <img src={im.url} alt="" className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-sub font-mono mt-2">{images.length} photo{images.length > 1 ? "s" : ""}</div>
            </div>
          );
        }

        const FRAMES = [
          { x: "-20vw", y: "-15vh", rotate: -12, w: "30vh", z: 1 },
          { x: "10vw", y: "-22vh", rotate: 8, w: "28vh", z: 2 },
          { x: "25vw", y: "5vh", rotate: -15, w: "32vh", z: 3 },
          { x: "-28vw", y: "15vh", rotate: 14, w: "26vh", z: 4 },
          { x: "0vw", y: "0vh", rotate: -5, w: "36vh", z: 8 }, // top center
          { x: "12vw", y: "-5vh", rotate: 12, w: "30vh", z: 6 },
          { x: "-12vw", y: "20vh", rotate: -8, w: "28vh", z: 7 },
          { x: "20vw", y: "22vh", rotate: 5, w: "32vh", z: 5 },
        ];

        return (
          <div className="relative h-full w-full bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
            
            <div className="absolute top-8 left-12 z-50 flex items-center gap-4">
              <div className="p-3 bg-violet/20 rounded-xl">
                <Images size={28} className="text-violet" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">{d.title ?? "Galerie campus"}</h2>
              </div>
            </div>

            {displayedIndices.map((imgIdx, slotIdx) => {
              const cur = images[imgIdx];
              const frame = FRAMES[slotIdx];
              if (!frame || !cur) return null;

              return (
                <div 
                  key={slotIdx}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    transform: `translate(calc(-50% + ${frame.x}), calc(-50% + ${frame.y})) rotate(${frame.rotate}deg)`,
                    width: m === "fullscreen" ? frame.w : `calc(${frame.w} * 0.7)`, // scale down slightly for preview
                    zIndex: frame.z
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={imgIdx + "-" + flipState}
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                      transition={{ duration: 0.6 }}
                      className="w-full aspect-[4/5] bg-[#F9F9F9] p-[4%] pb-[16%] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-sm flex flex-col relative"
                    >
                      <div className="flex-1 w-full bg-black/10 overflow-hidden shadow-inner">
                        <img src={cur.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              );
            })}

            {images.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/40 z-0">
                Aucune photo dans la galerie
              </div>
            )}
          </div>
        );
      }}
    </WidgetWrapper>
  );
}
